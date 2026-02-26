import Stripe from "stripe";
import { RideOffer } from "../models/RideOffer.js";
import { RideBooking } from "../models/RideBooking.js";
import { HttpError } from "../utils/httpError.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createStripeCheckoutSession(req, res, next) {
  try {
    const { offerId, seatsBooked } = req.body || {};
    const seats = Number(seatsBooked || 1);
    if (!offerId) throw new HttpError(400, "offerId is required");
    if (!Number.isFinite(seats) || seats < 1 || seats > 6) throw new HttpError(400, "Invalid seatsBooked");

    const offer = await RideOffer.findById(offerId);
    if (!offer) throw new HttpError(404, "Offer not found");
    if (offer.status !== "open") throw new HttpError(409, "Offer not open");

    // ✅ reserve seats NOW (same logic as booking controller)
    const updated = await RideOffer.findOneAndUpdate(
      { _id: offerId, status: "open", seatsAvailable: { $gte: seats } },
      { $inc: { seatsAvailable: -seats } },
      { new: true }
    );
    if (!updated) throw new HttpError(409, "Not enough seats");

    // amount: you decide your rule (here: priceLkr is TOTAL per booking)
    const amountLkr = Number(updated.priceLkr || 0);
    if (amountLkr <= 0) throw new HttpError(400, "Offer has no price set");

    // ✅ create booking pending
    const booking = await RideBooking.create({
      offerId: updated._id,
      riderId: req.user.sub,
      driverId: updated.driverId,
      seatsBooked: seats,
      status: "pending",
      paymentStatus: "unpaid",
      amount: amountLkr,
      currency: "lkr",
    });

    const base = process.env.CLIENT_ORIGIN || "http://localhost:5173";

    // Stripe expects smallest unit (cents) for many currencies.
    // If you use LKR in Stripe, ensure you handle unit correctly for your chosen currency.
    // For demo: treat price as LKR and multiply by 100 (adjust if needed).
    const unitAmount = Math.round(amountLkr * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "lkr",
            product_data: {
              name: "DropMe Ride Booking",
              description: `${updated.origin.address} → ${updated.destination.address}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/checkout/success?bookingId=${booking._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout/cancel?bookingId=${booking._id}`,
      metadata: {
        bookingId: String(booking._id),
        offerId: String(updated._id),
        riderId: String(req.user.sub),
      },
    });

    booking.stripeSessionId = session.id;
    await booking.save();

    res.json({ ok: true, url: session.url, bookingId: booking._id });
  } catch (err) {
    next(err);
  }
}

export async function verifyStripeSession(req, res, next) {
  try {
    const { session_id, bookingId } = req.query;
    if (!session_id || !bookingId) throw new HttpError(400, "session_id and bookingId required");

    const session = await stripe.checkout.sessions.retrieve(String(session_id));
    if (!session) throw new HttpError(404, "Stripe session not found");

    const booking = await RideBooking.findById(bookingId).populate("offerId");
    if (!booking) throw new HttpError(404, "Booking not found");

    // rider/admin only
    const isOwner = String(booking.riderId) === String(req.user.sub);
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) throw new HttpError(403, "Not allowed");

    if (session.payment_status === "paid") {
      booking.paymentStatus = "paid";
      booking.status = "confirmed";
      booking.paidAt = new Date();
      await booking.save();

      // ✅ notify driver/rider
      req.io?.to(`driver:${String(booking.driverId)}`).emit("booking:confirmed", { bookingId: String(booking._id) });
      req.io?.to(`rider:${String(booking.riderId)}`).emit("booking:confirmed", { bookingId: String(booking._id) });
    }

    res.json({ ok: true, booking });
  } catch (err) {
    next(err);
  }
}