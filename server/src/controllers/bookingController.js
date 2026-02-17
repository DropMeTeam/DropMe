import Booking from "../models/Booking.js";
import Ride from "../models/Ride.js";

export async function createBooking(req, res) {
  const user = req.user;
  const { rideId, seats } = req.body;
  const seatsNum = Number(seats);

  if (!seatsNum || seatsNum < 1) return res.status(400).json({ message: "Invalid seats." });

  // Atomic seat decrement (prevents overbooking)
  const ride = await Ride.findOneAndUpdate(
    { _id: rideId, seatsAvailable: { $gte: seatsNum }, status: "active" },
    { $inc: { seatsAvailable: -seatsNum } },
    { new: true }
  );

  if (!ride) return res.status(409).json({ message: "Not enough seats available." });

  const estFare =
    ride.distanceMeters != null
      ? ((ride.distanceMeters / 1000) * ride.costPerKm).toFixed(0)
      : null;

  const booking = await Booking.create({
    rideId: ride._id,
    riderUserId: user._id,
    seatsBooked: seatsNum,
    estFare: estFare ? Number(estFare) : null,
  });

  res.json({ booking, ride });
}

export async function myBookings(req, res) {
  const list = await Booking.find({ riderUserId: req.user._id })
    .populate("rideId")
    .sort({ createdAt: -1 });

  res.json({ bookings: list });
}
