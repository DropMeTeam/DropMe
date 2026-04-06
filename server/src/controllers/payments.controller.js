import Stripe from "stripe";
import { RideOffer } from "../models/RideOffer.js";
import { RideBooking } from "../models/RideBooking.js";
import { HttpError } from "../utils/httpError.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function normalizeDistanceKm(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Number(num.toFixed(1));
}

function buildDistanceText(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return "";
  return `${distanceKm.toFixed(1)} km`;
}

export async function createStripeSession(req, res, next) {
  try {
    const { offerId, seatsBooked, routeDistanceKm } = req.body || {};
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

    const unitPrice = Number(offer.priceLkr || 0);

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new HttpError(400, "Offer price not set");
    }

    const totalAmount = unitPrice * seats;

    const normalizedDistanceKm = normalizeDistanceKm(routeDistanceKm);
    const routeDistanceText = buildDistanceText(normalizedDistanceKm);

    let booking;

    try {
      booking = await RideBooking.create({
        offerId: offer._id,
        riderId: req.user.sub,
        driverId: offer.driverId,
        seatsBooked: seats,
        status: "pending",
        paymentStatus: "unpaid",
        amount: totalAmount,
        currency: "lkr",
        stripeSessionId: "",

        routeDistanceKm: normalizedDistanceKm,
        routeDistanceText,

        offerSnapshot: {
          originAddress: offer.origin?.address || "",
          destinationAddress: offer.destination?.address || "",
          pickupTime: offer.pickupTime || null,
          priceLkr: unitPrice,
          driverName: offer.driverSnapshot?.name || "",
          driverEmail: offer.driverSnapshot?.email || "",
          vehicleType: offer.vehicleSnapshot?.type || "",
          vehicleNumber: offer.vehicleSnapshot?.number || "",
          vehicleColor: offer.vehicleSnapshot?.color || "",
          routeDistanceKm: normalizedDistanceKm,
          routeDistanceText,
        },
      });
    } catch (e) {
      if (e?.code === 11000) {
        throw new HttpError(409, "You already booked this ride.");
      }
      throw e;
    }

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
            unit_amount: Math.round(unitPrice * 100),
          },
          quantity: seats,
        },
      ],
      success_url: `${base}/checkout/success?bookingId=${booking._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout/cancel?bookingId=${booking._id}`,
      metadata: {
        bookingId: String(booking._id),
        offerId: String(offer._id),
        seatsBooked: String(seats),
        unitPrice: String(unitPrice),
        totalAmount: String(totalAmount),
        routeDistanceKm: String(normalizedDistanceKm),
      },
    });

    booking.stripeSessionId = session.id;
    await booking.save();

    res.json({
      ok: true,
      url: session.url,
      bookingId: booking._id,
      seatsBooked: seats,
      unitPrice,
      totalAmount,
      routeDistanceKm: normalizedDistanceKm,
      routeDistanceText,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyStripePayment(req, res, next) {
  try {
    const bookingId = String(req.query.bookingId || "");
    const sessionId = String(req.query.session_id || "");

    if (!bookingId || !sessionId) {
      throw new HttpError(400, "bookingId and session_id are required");
    }

    const booking = await RideBooking.findById(bookingId);

    if (!booking) {
      throw new HttpError(404, "Booking not found");
    }

    const isOwner = String(booking.riderId) === String(req.user.sub);
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      throw new HttpError(403, "Not allowed");
    }

    if (booking.stripeSessionId && booking.stripeSessionId !== sessionId) {
      throw new HttpError(400, "Session mismatch");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new HttpError(402, "Payment not completed");
    }

    if (booking.paymentStatus === "paid" && booking.status === "confirmed") {
      return res.json({ ok: true, booking });
    }

    const offer = await RideOffer.findOneAndUpdate(
      {
        _id: booking.offerId,
        status: "open",
        seatsAvailable: { $gte: booking.seatsBooked },
      },
      {
        $inc: { seatsAvailable: -booking.seatsBooked },
      },
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

    res.json({ ok: true, booking, offer });
  } catch (err) {
    next(err);
  }
}