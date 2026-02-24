// controllers/booking.controller.js
import mongoose from "mongoose";
import { RideOffer } from "../models/RideOffer.js";
import { RideBooking } from "../models/RideBooking.js";
import { CreateBookingSchema } from "../validators/booking.validators.js";

export async function createBooking(req, res, next) {
  const session = await mongoose.startSession();
  try {
    const body = CreateBookingSchema.parse(req.body);

    // optional: block drivers from booking
    if (String(req.user?.role || "") === "driver") {
      return res.status(403).json({ message: "Drivers cannot book rides." });
    }

    const now = new Date();

    session.startTransaction();

    // ✅ Atomically reserve seats (only if offer is open + future + has seats)
    const offer = await RideOffer.findOneAndUpdate(
      {
        _id: body.offerId,
        status: "open",
        pickupTime: { $gte: now },
        seatsAvailable: { $gte: body.seatsBooked },
      },
      { $inc: { seatsAvailable: -body.seatsBooked } },
      { new: true, session }
    );

    if (!offer) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Offer not available (past time / closed / insufficient seats).",
      });
    }

    const bookingDoc = {
      offerId: offer._id,
      riderId: req.user.sub,
      seatsBooked: body.seatsBooked,
      status: "confirmed",

      driverSnapshot: {
        name: offer?.driverSnapshot?.name || "",
        avatarUrl: offer?.driverSnapshot?.avatarUrl || "",
      },
      vehicleSnapshot: {
        type: offer?.vehicleSnapshot?.type || "",
        number: offer?.vehicleSnapshot?.number || "",
        color: offer?.vehicleSnapshot?.color || "",
        photoUrl: offer?.vehicleSnapshot?.photoUrl || "",
      },

      pickupTime: offer.pickupTime,
      originAddress: offer?.origin?.address || "",
      destinationAddress: offer?.destination?.address || "",
      priceLkr: offer?.priceLkr || 0,
    };

    const [booking] = await RideBooking.create([bookingDoc], { session });

    await session.commitTransaction();
    res.status(201).json({ booking, offer });
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch {}
    next(err);
  } finally {
    session.endSession();
  }
}

export async function myBookings(req, res, next) {
  try {
    const bookings = await RideBooking.find({ riderId: req.user.sub }).sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
}