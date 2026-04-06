import { TrainSchedule } from "../models/TrainSchedule.js";
import { TrainBooking } from "../models/TrainBooking.js";
import { HttpError } from "../../../utils/httpError.js";
import { calculateJourneyFare } from "../utils/trainFare.js";
import {
  generateTrainTicketPdfBuffer,
  getTrainTicketFilename,
} from "../utils/trainTicket.js";

const MIN_TRAIN_PAYMENT_LKR = Number(process.env.MIN_TRAIN_PAYMENT_LKR || 200);

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

function toSafeNonNegativeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : fallback;
}

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

    const schedule = await TrainSchedule.findById(scheduleId).lean();
    if (!schedule) {
      throw new HttpError(404, "Train schedule not found");
    }

    const travelDay = getTravelDay(travelDate);
    const { farePerSeatLkr } = calculateJourneyFare(
      schedule,
      boardingStationId,
      destinationStationId,
      travelDay
    );

    const serverTotalFare = farePerSeatLkr * seatCount;

    if (!Number.isFinite(serverTotalFare) || serverTotalFare < MIN_TRAIN_PAYMENT_LKR) {
      throw new HttpError(
        400,
        `Minimum train payment is LKR ${MIN_TRAIN_PAYMENT_LKR}. Current total is LKR ${serverTotalFare.toFixed(2)}.`
      );
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
      travelDay,
      seats: seatCount,
      totalFareLkr: serverTotalFare,
      bookingStatus: "pending_payment",
      paymentStatus: "pending",
      stripeSessionId: "",
      paymentReference: "",
      paidAt: null,
      ticketNumber: "",
      ticketEmailSentAt: null,
      journeySnapshot: {
        trainNo: journeySnapshot.trainNo || schedule.trainNo || "",
        trainName: journeySnapshot.trainName || schedule.trainName || "",
        departureTime: journeySnapshot.departureTime || "",
        arrivalTime: journeySnapshot.arrivalTime || "",
        durationLabel: journeySnapshot.durationLabel || "",
        durationMinutes: toSafeNonNegativeNumber(
          journeySnapshot.durationMinutes,
          0
        ),
        distanceKm: toSafeNonNegativeNumber(journeySnapshot.distanceKm, 0),
        farePerSeatLkr,
        fareBreakdownTotalLkr: serverTotalFare,
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
    if (!isOwner) {
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

export async function downloadMyTrainTicket(req, res, next) {
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
    if (!isOwner) {
      throw new HttpError(403, "Not allowed");
    }

    if (booking.paymentStatus !== "paid" || booking.bookingStatus !== "booked") {
      throw new HttpError(400, "Ticket is available only after successful payment");
    }

    const pdfBuffer = await generateTrainTicketPdfBuffer(booking);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${getTrainTicketFilename(booking)}"`
    );

    return res.end(pdfBuffer);
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
    if (!isOwner) {
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