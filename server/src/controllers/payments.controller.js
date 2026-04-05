import Stripe from "stripe";
import { RideOffer } from "../models/RideOffer.js";
import { RideBooking } from "../models/RideBooking.js";
import { HttpError } from "../utils/httpError.js";
import { TrainBooking } from "../modules/train/models/TrainBooking.js";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Safe floor for tiny train payments.
// You can move this to .env if you want:
// MIN_TRAIN_PAYMENT_LKR=200
const MIN_TRAIN_PAYMENT_LKR = Number(process.env.MIN_TRAIN_PAYMENT_LKR || 200);

function getUserId(req) {
  return String(req.user?.sub || req.user?._id || req.user?.id || "");
}

function requireStripeClient() {
  if (!stripe) {
    throw new HttpError(500, "STRIPE_SECRET_KEY is not configured");
  }
  return stripe;
}

function requireRider(req) {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  if (req.user.role !== "rider") {
    throw new HttpError(403, "Only riders can perform this action");
  }
}

function getClientBaseUrl() {
  return String(process.env.CLIENT_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
}

function getSafeStripeMessage(err) {
  return err?.raw?.message || err?.message || "Stripe session creation failed";
}

// =========================
// EXISTING RIDE STRIPE FLOW
// =========================
export async function createStripeSession(req, res, next) {
  try {
    requireRider(req);

    const { offerId, seatsBooked } = req.body || {};
    const seats = Number(seatsBooked || 1);

    if (!offerId) {
      throw new HttpError(400, "offerId is required");
    }

    if (!Number.isFinite(seats) || seats < 1 || seats > 6) {
      throw new HttpError(400, "Invalid seatsBooked");
    }

    const offer = await RideOffer.findById(offerId).lean();
    if (!offer) {
      throw new HttpError(404, "Offer not found");
    }

    if (offer.status !== "open") {
      throw new HttpError(409, "Offer not open");
    }

    if ((offer.seatsAvailable ?? 0) < seats) {
      throw new HttpError(409, "Not enough seats");
    }

    const amount = Number(offer.priceLkr || 0);
    if (amount <= 0) {
      throw new HttpError(400, "Offer price not set");
    }

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

    const stripeClient = requireStripeClient();
    const base = getClientBaseUrl();

    let session;
    try {
      session = await stripeClient.checkout.sessions.create({
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
        metadata: {
          bookingId: String(booking._id),
          offerId: String(offer._id),
          module: "ride",
          riderId: String(getUserId(req)),
        },
      });
    } catch (err) {
      booking.status = "rejected";
      booking.paymentStatus = "failed";
      await booking.save();

      throw new HttpError(err?.statusCode || 500, getSafeStripeMessage(err));
    }

    booking.stripeSessionId = session.id;
    await booking.save();

    return res.json({
      ok: true,
      url: session.url,
      bookingId: booking._id,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyStripePayment(req, res, next) {
  try {
    requireRider(req);

    const bookingId = String(req.query.bookingId || "");
    const sessionId = String(req.query.session_id || "");

    if (!bookingId || !sessionId) {
      throw new HttpError(400, "bookingId and session_id are required");
    }

    const booking = await RideBooking.findById(bookingId);
    if (!booking) {
      throw new HttpError(404, "Booking not found");
    }

    const isOwner = String(booking.riderId) === getUserId(req);
    if (!isOwner) {
      throw new HttpError(403, "Not allowed");
    }

    if (booking.stripeSessionId && booking.stripeSessionId !== sessionId) {
      throw new HttpError(400, "Session mismatch");
    }

    const stripeClient = requireStripeClient();
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new HttpError(402, "Payment not completed");
    }

    const offer = await RideOffer.findOneAndUpdate(
      {
        _id: booking.offerId,
        status: "open",
        seatsAvailable: { $gte: booking.seatsBooked },
      },
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

    return res.json({ ok: true, booking });
  } catch (err) {
    next(err);
  }
}

// =========================
// TRAIN STRIPE FLOW
// =========================
export async function createTrainStripeSession(req, res, next) {
  try {
    requireRider(req);

    const { bookingId } = req.body || {};
    if (!bookingId) {
      throw new HttpError(400, "bookingId is required");
    }

    const booking = await TrainBooking.findById(bookingId);
    if (!booking) {
      throw new HttpError(404, "Train booking not found");
    }

    const userId = getUserId(req);
    const isOwner = String(booking.passengerId) === userId;

    if (!isOwner) {
      throw new HttpError(403, "Only the booking rider can pay for this train booking");
    }

    if (booking.bookingStatus === "cancelled") {
      throw new HttpError(409, "Booking is cancelled");
    }

    if (booking.bookingStatus === "failed") {
      throw new HttpError(409, "Booking is marked as failed");
    }

    if (booking.paymentStatus === "paid") {
      throw new HttpError(409, "Booking is already paid");
    }

    const amount = Number(booking.totalFareLkr || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new HttpError(400, "Train booking amount is invalid");
    }

    const unitAmount = Math.round(amount * 100);
    if (!Number.isInteger(unitAmount) || unitAmount <= 0) {
      throw new HttpError(400, "Train booking amount is invalid for Stripe");
    }

    const stripeClient = requireStripeClient();
    const base = getClientBaseUrl();

    const trainNo = booking.journeySnapshot?.trainNo || "";
    const trainName = booking.journeySnapshot?.trainName || "";
    const dep = booking.journeySnapshot?.departureTime || "";
    const arr = booking.journeySnapshot?.arrivalTime || "";

    let session;
    try {
      session = await stripeClient.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        client_reference_id: String(booking._id),
        customer_email: booking.passengerSnapshot?.email || undefined,
        line_items: [
          {
            price_data: {
              currency: "lkr",
              product_data: {
                name: "DropMe Train Booking",
                description:
                  `${booking.boardingStationName} → ${booking.destinationStationName}` +
                  `${trainNo ? ` | ${trainNo}` : ""}` +
                  `${trainName ? ` | ${trainName}` : ""}` +
                  `${dep || arr ? ` | ${dep} - ${arr}` : ""}` +
                  `${booking.travelDate ? ` | ${booking.travelDate}` : ""}`,
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        success_url:
          `${base}/train-service/bookings?payment=success` +
          `&bookingId=${booking._id}` +
          `&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:
          `${base}/train-service/bookings?payment=cancelled` +
          `&bookingId=${booking._id}`,
        metadata: {
          bookingId: String(booking._id),
          module: "train",
          passengerId: String(booking.passengerId),
          riderRole: String(req.user.role || ""),
          scheduleId: String(booking.scheduleId || ""),
        },
      });
    } catch (err) {
      booking.bookingStatus = "failed";
      booking.paymentStatus = "failed";
      await booking.save();

      throw new HttpError(err?.statusCode || 500, getSafeStripeMessage(err));
    }

    booking.stripeSessionId = session.id;
    booking.bookingStatus = "pending_payment";
    booking.paymentStatus = "pending";
    await booking.save();

    return res.json({
      ok: true,
      url: session.url,
      bookingId: booking._id,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyTrainStripePayment(req, res, next) {
  try {
    requireRider(req);

    const bookingId = String(req.query.bookingId || "");
    const sessionId = String(req.query.session_id || "");

    if (!bookingId || !sessionId) {
      throw new HttpError(400, "bookingId and session_id are required");
    }

    const booking = await TrainBooking.findById(bookingId);
    if (!booking) {
      throw new HttpError(404, "Train booking not found");
    }

    const userId = getUserId(req);
    const isOwner = String(booking.passengerId) === userId;

    if (!isOwner) {
      throw new HttpError(403, "Only the booking rider can verify this payment");
    }

    if (booking.stripeSessionId && booking.stripeSessionId !== sessionId) {
      throw new HttpError(400, "Session mismatch");
    }

    const stripeClient = requireStripeClient();
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new HttpError(402, "Payment not completed");
    }

    booking.bookingStatus = "booked";
    booking.paymentStatus = "paid";
    booking.paymentReference = String(
      session.payment_intent || booking.paymentReference || ""
    );
    booking.stripeSessionId = session.id;

    await booking.save();

    return res.json({ ok: true, booking });
  } catch (err) {
    next(err);
  }
}