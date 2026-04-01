import Stripe from "stripe";
import { RideOffer } from "../models/RideOffer.js";
import { RideBooking } from "../models/RideBooking.js";
import { HttpError } from "../utils/httpError.js";
import { TrainBooking } from "../modules/train/models/TrainBooking.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function getUserId(req) {
  return String(req.user?.sub || req.user?._id || req.user?.id || "");
}

// =========================
// EXISTING RIDE STRIPE FLOW
// =========================
export async function createStripeSession(req, res, next) {
  try {
    const { offerId, seatsBooked } = req.body || {};
    const seats = Number(seatsBooked || 1);

    if (!offerId) throw new HttpError(400, "offerId is required");
    if (!Number.isFinite(seats) || seats < 1 || seats > 6) throw new HttpError(400, "Invalid seatsBooked");

    const offer = await RideOffer.findById(offerId).lean();
    if (!offer) throw new HttpError(404, "Offer not found");
    if (offer.status !== "open") throw new HttpError(409, "Offer not open");
    if ((offer.seatsAvailable ?? 0) < seats) throw new HttpError(409, "Not enough seats");

    const amount = Number(offer.priceLkr || 0);
    if (amount <= 0) throw new HttpError(400, "Offer price not set");

    const booking = await RideBooking.create({
      offerId: offer._id,
      riderId: getUserId(req),
      driverId: offer.driverId,
      seatsBooked: seats,
      status: "pending",
      paymentStatus: "unpaid",
      amount,
      currency: "lkr",
      stripeSessionId: "",
      offerSnapshot: {
        originAddress: offer.origin?.address || "",
        destinationAddress: offer.destination?.address || "",
        pickupTime: offer.pickupTime || null,
        priceLkr: amount,
        driverName: offer.driverSnapshot?.name || "",
        driverEmail: offer.driverSnapshot?.email || "",
        vehicleType: offer.vehicleSnapshot?.type || "",
        vehicleNumber: offer.vehicleSnapshot?.number || "",
        vehicleColor: offer.vehicleSnapshot?.color || "",
      },
    });

    const base = process.env.CLIENT_ORIGIN || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "lkr",
            product_data: {
              name: "DropMe Ride Booking",
              description: `${offer.origin?.address || ""} → ${offer.destination?.address || ""}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/checkout/success?bookingId=${booking._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout/cancel?bookingId=${booking._id}`,
      metadata: { bookingId: String(booking._id), offerId: String(offer._id), module: "ride" },
    });

    booking.stripeSessionId = session.id;
    await booking.save();

    res.json({ ok: true, url: session.url, bookingId: booking._id });
  } catch (err) {
    next(err);
  }
}

export async function verifyStripePayment(req, res, next) {
  try {
    const bookingId = String(req.query.bookingId || "");
    const sessionId = String(req.query.session_id || "");
    if (!bookingId || !sessionId) throw new HttpError(400, "bookingId and session_id are required");

    const booking = await RideBooking.findById(bookingId);
    if (!booking) throw new HttpError(404, "Booking not found");

    const isOwner = String(booking.riderId) === getUserId(req);
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) throw new HttpError(403, "Not allowed");

    if (booking.stripeSessionId && booking.stripeSessionId !== sessionId) {
      throw new HttpError(400, "Session mismatch");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") throw new HttpError(402, "Payment not completed");

    const offer = await RideOffer.findOneAndUpdate(
      { _id: booking.offerId, status: "open", seatsAvailable: { $gte: booking.seatsBooked } },
      { $inc: { seatsAvailable: -booking.seatsBooked } },
      { new: true }
    );

    if (!offer) {
      booking.status = "rejected";
      booking.paymentStatus = "failed";
      await booking.save();
      throw new HttpError(409, "Ride sold out while paying. Booking rejected.");
    }

    booking.status = "confirmed";
    booking.paymentStatus = "paid";
    booking.paidAt = new Date();
    await booking.save();

    res.json({ ok: true, booking });
  } catch (err) {
    next(err);
  }
}

// =========================
// NEW TRAIN STRIPE FLOW
// =========================
export async function createTrainStripeSession(req, res, next) {
  try {
    const { bookingId } = req.body || {};
    if (!bookingId) throw new HttpError(400, "bookingId is required");

    const booking = await TrainBooking.findById(bookingId);
    if (!booking) throw new HttpError(404, "Train booking not found");

    const isOwner = String(booking.passengerId) === getUserId(req);
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) throw new HttpError(403, "Not allowed");

    if (booking.bookingStatus === "cancelled") {
      throw new HttpError(409, "Booking is cancelled");
    }

    if (booking.paymentStatus === "paid") {
      throw new HttpError(409, "Booking is already paid");
    }

    const amount = Number(booking.totalFareLkr || 0);
    if (amount <= 0) throw new HttpError(400, "Train booking amount is invalid");

    const base = process.env.CLIENT_ORIGIN || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "lkr",
            product_data: {
              name: "DropMe Train Booking",
              description: `${booking.boardingStationName} → ${booking.destinationStationName} on ${booking.travelDate}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/train-service/bookings?payment=success&bookingId=${booking._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/train-service/bookings?payment=cancelled&bookingId=${booking._id}`,
      metadata: {
        bookingId: String(booking._id),
        module: "train",
        passengerId: String(booking.passengerId),
      },
    });

    booking.stripeSessionId = session.id;
    await booking.save();

    res.json({ ok: true, url: session.url, bookingId: booking._id });
  } catch (err) {
    next(err);
  }
}

export async function verifyTrainStripePayment(req, res, next) {
  try {
    const bookingId = String(req.query.bookingId || "");
    const sessionId = String(req.query.session_id || "");
    if (!bookingId || !sessionId) {
      throw new HttpError(400, "bookingId and session_id are required");
    }

    const booking = await TrainBooking.findById(bookingId);
    if (!booking) throw new HttpError(404, "Train booking not found");

    const isOwner = String(booking.passengerId) === getUserId(req);
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) throw new HttpError(403, "Not allowed");

    if (booking.stripeSessionId && booking.stripeSessionId !== sessionId) {
      throw new HttpError(400, "Session mismatch");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      throw new HttpError(402, "Payment not completed");
    }

    booking.bookingStatus = "booked";
    booking.paymentStatus = "paid";
    booking.paymentReference =
      String(session.payment_intent || booking.paymentReference || "");
    booking.stripeSessionId = session.id;

    await booking.save();

    res.json({ ok: true, booking });
  } catch (err) {
    next(err);
  }
}