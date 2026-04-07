import { TrainBooking } from "../models/TrainBooking.js";
import { HttpError } from "../../../utils/httpError.js";

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function deriveVerificationStatus(booking) {
  if (booking.bookingStatus === "cancelled") return "cancelled";
  if (booking.paymentStatus !== "paid" || booking.bookingStatus !== "booked") {
    return "unpaid";
  }
  return "valid";
}

function serializeBooking(booking) {
  if (!booking) return null;
  return {
    id: String(booking._id),
    ticketNumber: booking.ticketNumber || "",
    passengerName: booking.passengerSnapshot?.name || "",
    passengerEmail: booking.passengerSnapshot?.email || "",
    trainNo: booking.journeySnapshot?.trainNo || "",
    trainName: booking.journeySnapshot?.trainName || "",
    boardingStation: booking.boardingStationName || "",
    destinationStation: booking.destinationStationName || "",
    travelDate: booking.travelDate || "",
    travelDay: booking.travelDay || "",
    seats: booking.seats,
    totalFareLkr: booking.totalFareLkr,
    paymentStatus: booking.paymentStatus,
    bookingStatus: booking.bookingStatus,
    ticketEmailSentAt: booking.ticketEmailSentAt
      ? new Date(booking.ticketEmailSentAt).toISOString()
      : null,
  };
}

async function findBookingByCode(raw) {
  const code = String(raw || "").trim();
  if (!code) return null;

  let booking = await TrainBooking.findOne({
    ticketNumber: { $regex: new RegExp(`^${escapeRegex(code)}$`, "i") },
  }).lean();
  if (booking) return booking;

  if (/^[a-f0-9]{24}$/i.test(code)) {
    booking = await TrainBooking.findById(code).lean();
    if (booking) return booking;
  }

  const trnMatch = code.match(/\bTRN-[A-Z0-9-]+\b/i);
  if (trnMatch) {
    booking = await TrainBooking.findOne({
      ticketNumber: { $regex: new RegExp(`^${escapeRegex(trnMatch[0])}$`, "i") },
    }).lean();
    if (booking) return booking;
  }

  const hexMatch = code.match(/[a-f0-9]{24}/i);
  if (hexMatch && /^[a-f0-9]{24}$/i.test(hexMatch[0])) {
    booking = await TrainBooking.findById(hexMatch[0]).lean();
    if (booking) return booking;
  }

  return null;
}

/**
 * POST /api/admin/train/tickets/verify
 * Body: { code: string }
 * ADMIN_TRAIN only (router middleware).
 */
export async function verifyTrainTicketCode(req, res, next) {
  try {
    const code = String(req.body?.code ?? "").trim();
    if (!code) {
      throw new HttpError(400, "code is required");
    }

    const booking = await findBookingByCode(code);

    if (!booking) {
      return res.json({
        ok: true,
        verificationStatus: "not_found",
        message: "No booking found for this code",
        booking: null,
      });
    }

    const verificationStatus = deriveVerificationStatus(booking);

    return res.json({
      ok: true,
      verificationStatus,
      booking: serializeBooking(booking),
    });
  } catch (e) {
    next(e);
  }
}
