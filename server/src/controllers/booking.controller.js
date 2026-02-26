import { RideOffer } from "../models/RideOffer.js";
import { RideBooking } from "../models/RideBooking.js";
import { HttpError } from "../utils/httpError.js";

export async function createBooking(req, res, next) {
  try {
    const offerId = req.params.id;
    const seatsBooked = Number(req.body?.seatsBooked || 1);

    if (!Number.isFinite(seatsBooked) || seatsBooked < 1 || seatsBooked > 6) {
      throw new HttpError(400, "Invalid seatsBooked");
    }

    // 1) Reserve seats atomically
    const offer = await RideOffer.findOneAndUpdate(
      { _id: offerId, status: "open", seatsAvailable: { $gte: seatsBooked } },
      { $inc: { seatsAvailable: -seatsBooked } },
      { new: true }
    );

    if (!offer) throw new HttpError(409, "Not enough seats or offer not available");

    // 2) Create booking record (unique constraint avoids duplicates)
    let booking;
    try {
      booking = await RideBooking.create({
        offerId: offer._id,
        riderId: req.user.sub,
        driverId: offer.driverId,
        seatsBooked,
        status: "pending",
      });
    } catch (e) {
      // rollback seats if booking insert fails
      await RideOffer.updateOne({ _id: offer._id }, { $inc: { seatsAvailable: seatsBooked } });

      // ✅ duplicate booking
      if (e?.code === 11000) throw new HttpError(409, "You already booked this offer.");

      throw e;
    }

    // 3) Notify driver
    req.io?.to(`driver:${String(offer.driverId)}`).emit("booking:new", {
      bookingId: String(booking._id),
      offerId: String(offer._id),
      seatsBooked,
    });

    res.status(201).json({ ok: true, booking, offer });
  } catch (err) {
    next(err);
  }
}

export async function myBookings(req, res, next) {
  try {
    const bookings = await RideBooking.find({ riderId: req.user.sub })
      .populate("offerId")
      .sort({ createdAt: -1 });

    res.json({ ok: true, bookings });
  } catch (err) {
    next(err);
  }
}

export async function offerBookings(req, res, next) {
  try {
    const offer = await RideOffer.findById(req.params.id);
    if (!offer) throw new HttpError(404, "Offer not found");

    const isOwner = String(offer.driverId) === String(req.user.sub);
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) throw new HttpError(403, "Not allowed");

    const bookings = await RideBooking.find({ offerId: offer._id }).sort({ createdAt: -1 });
    res.json({ ok: true, bookings });
  } catch (err) {
    next(err);
  }
}

export async function updateBookingStatus(req, res, next) {
  try {
    const booking = await RideBooking.findById(req.params.bookingId);
    if (!booking) throw new HttpError(404, "Booking not found");

    const offer = await RideOffer.findById(booking.offerId);
    if (!offer) throw new HttpError(404, "Offer not found");

    const isOwner = String(offer.driverId) === String(req.user.sub);
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) throw new HttpError(403, "Not allowed");

    // ✅ prevent double refund
    if (booking.status !== "pending") {
      throw new HttpError(400, `Cannot change status from ${booking.status}`);
    }

    const nextStatus = String(req.body?.status || "");
    if (!["confirmed", "rejected"].includes(nextStatus)) {
      throw new HttpError(400, "Invalid status");
    }

    if (nextStatus === "rejected") {
      await RideOffer.updateOne(
        { _id: offer._id },
        { $inc: { seatsAvailable: booking.seatsBooked } }
      );
    }

    booking.status = nextStatus;
    await booking.save();

    req.io?.to(`rider:${String(booking.riderId)}`).emit("booking:status", {
      bookingId: String(booking._id),
      status: booking.status,
    });

    res.json({ ok: true, booking });
  } catch (err) {
    next(err);
  }
}