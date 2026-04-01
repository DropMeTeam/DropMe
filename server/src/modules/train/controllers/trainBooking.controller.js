import { TrainSchedule } from "../models/TrainSchedule.js";
import { TrainBooking } from "../models/TrainBooking.js";
import { HttpError } from "../../../utils/httpError.js";

function getUserId(req) {
  return String(req.user?.sub || req.user?._id || req.user?.id || "");
}

function getTravelDay(travelDate) {
  const date = new Date(`${travelDate}T00:00:00`);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, "Invalid travelDate. Use YYYY-MM-DD");
  }
  return days[date.getDay()];
}

/**
 * Create a pending train booking.
 * Then frontend can call:
 * POST /api/payments/stripe/train/session
 * with { bookingId }
 */
export async function createTrainBookingCheckout(req, res, next) {
  try {
    const passengerId = getUserId(req);

    if (!passengerId) {
      throw new HttpError(401, "Unauthorized");
    }

    const {
      scheduleId,
      boardingStationId,
      boardingStationName,
      destinationStationId,
      destinationStationName,
      travelDate,
      seats = 1,
      totalFareLkr,
      journeySnapshot = {},
    } = req.body || {};

    if (!scheduleId) throw new HttpError(400, "scheduleId is required");
    if (!boardingStationId) throw new HttpError(400, "boardingStationId is required");
    if (!boardingStationName) throw new HttpError(400, "boardingStationName is required");
    if (!destinationStationId) throw new HttpError(400, "destinationStationId is required");
    if (!destinationStationName) throw new HttpError(400, "destinationStationName is required");
    if (!travelDate) throw new HttpError(400, "travelDate is required");

    const seatCount = Number(seats);
    if (!Number.isInteger(seatCount) || seatCount < 1) {
      throw new HttpError(400, "seats must be a positive integer");
    }

    const fare = Number(totalFareLkr);
    if (!Number.isFinite(fare) || fare < 0) {
      throw new HttpError(400, "totalFareLkr must be a valid number");
    }

    const schedule = await TrainSchedule.findById(scheduleId).lean();
    if (!schedule) {
      throw new HttpError(404, "Train schedule not found");
    }

    const booking = await TrainBooking.create({
      scheduleId,
      passengerId,
      passengerSnapshot: {
        name: req.user?.name || req.user?.fullName || "",
        email: req.user?.email || "",
        role: req.user?.role || "",
      },
      boardingStationId,
      boardingStationName,
      destinationStationId,
      destinationStationName,
      travelDate,
      travelDay: getTravelDay(travelDate),
      seats: seatCount,
      totalFareLkr: fare,
      bookingStatus: "pending_payment",
      paymentStatus: "pending",
      stripeSessionId: "",
      paymentReference: "",
      journeySnapshot: {
        trainNo: journeySnapshot.trainNo || schedule.trainNo || "",
        trainName: journeySnapshot.trainName || schedule.trainName || "",
        departureTime: journeySnapshot.departureTime || "",
        arrivalTime: journeySnapshot.arrivalTime || "",
        durationLabel: journeySnapshot.durationLabel || "",
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Train booking created. Proceed to payment.",
      booking,
    });
  } catch (err) {
    next(err);
  }
}

export async function listMyTrainBookings(req, res, next) {
  try {
    const passengerId = getUserId(req);

    if (!passengerId) {
      throw new HttpError(401, "Unauthorized");
    }

    const bookings = await TrainBooking.find({ passengerId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      count: bookings.length,
      bookings,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyTrainBookingById(req, res, next) {
  try {
    const passengerId = getUserId(req);
    const { id } = req.params;

    if (!passengerId) {
      throw new HttpError(401, "Unauthorized");
    }

    const booking = await TrainBooking.findById(id).lean();

    if (!booking) {
      throw new HttpError(404, "Train booking not found");
    }

    const isOwner = String(booking.passengerId) === passengerId;
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      throw new HttpError(403, "Not allowed");
    }

    return res.json({
      ok: true,
      booking,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelMyTrainBooking(req, res, next) {
  try {
    const passengerId = getUserId(req);
    const { id } = req.params;

    if (!passengerId) {
      throw new HttpError(401, "Unauthorized");
    }

    const booking = await TrainBooking.findById(id);

    if (!booking) {
      throw new HttpError(404, "Train booking not found");
    }

    const isOwner = String(booking.passengerId) === passengerId;
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      throw new HttpError(403, "Not allowed");
    }

    if (booking.paymentStatus === "paid") {
      throw new HttpError(409, "Paid bookings cannot be cancelled from this endpoint");
    }

    booking.bookingStatus = "cancelled";
    booking.paymentStatus = "cancelled";

    await booking.save();

    return res.json({
      ok: true,
      message: "Train booking cancelled",
      booking,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Optional manual mark-paid helper.
 * Usually Stripe verify endpoint should do this instead.
 */
export async function markTrainBookingPaid(req, res, next) {
  try {
    const { id } = req.params;

    const booking = await TrainBooking.findById(id);
    if (!booking) {
      throw new HttpError(404, "Train booking not found");
    }

    booking.bookingStatus = "booked";
    booking.paymentStatus = "paid";

    if (req.body?.paymentReference) {
      booking.paymentReference = String(req.body.paymentReference);
    }

    await booking.save();

    return res.json({
      ok: true,
      message: "Train booking marked as paid",
      booking,
    });
  } catch (err) {
    next(err);
  }
}