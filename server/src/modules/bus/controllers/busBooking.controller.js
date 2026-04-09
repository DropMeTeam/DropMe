import { HttpError } from "../../../utils/httpError.js";
import { BusBooking } from "../models/BusBooking.js";
import BusSchedule from "../models/BusSchedule.js";
import { generateBusTicketPdfBuffer } from "../utils/busTicketPdf.js";

const PAYMENT_HOLD_MINUTES = 10;

const FARE_RULES = {
  Normal: { baseFare: 35, perKm: 3.0, minFare: 35 },
  "Semi-luxury": { baseFare: 45, perKm: 3.75, minFare: 45 },
  Luxury: { baseFare: 60, perKm: 4.5, minFare: 60 },
  Expressway: { baseFare: 80, perKm: 5.75, minFare: 80 },
};

function getUserId(req) {
  return String(req.user?.sub || req.user?._id || req.user?.id || "");
}

function normalizeLabel(value = "") {
  return String(value).trim().toLowerCase();
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(pointA, pointB) {
  if (!pointA || !pointB) return 0;

  const earthRadiusKm = 6371;

  const latDelta = toRadians((pointB.lat || 0) - (pointA.lat || 0));
  const lngDelta = toRadians((pointB.lng || 0) - (pointA.lng || 0));
  const startLat = toRadians(pointA.lat || 0);
  const endLat = toRadians(pointB.lat || 0);

  const haversineValue =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(startLat) *
      Math.cos(endLat) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

  const angularDistance =
    2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return earthRadiusKm * angularDistance;
}

function roundUpToNearest(value, step = 5) {
  return Math.ceil(value / step) * step;
}

function calculateBusFare(busType, distanceKm) {
  const safeDistanceKm = Math.max(Number(distanceKm) || 0, 0);
  const selectedRule = FARE_RULES[busType] || FARE_RULES.Normal;

  const rawFare = selectedRule.baseFare + safeDistanceKm * selectedRule.perKm;
  const fareLkr = Math.max(selectedRule.minFare, roundUpToNearest(rawFare, 5));

  return {
    fareLkr,
    distanceKm: Number(safeDistanceKm.toFixed(1)),
  };
}

function getTravelDayOfWeek(travelDate) {
  const date = new Date(`${travelDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, "Invalid travelDate. Use YYYY-MM-DD");
  }
  return date.getDay();
}

function buildSegmentKeys(fromIndex, toIndex) {
  const keys = [];
  for (let i = fromIndex; i < toIndex; i += 1) {
    keys.push(`${i}-${i + 1}`);
  }
  return keys;
}

function hasOverlap(bookingSegmentKeys = [], requestedSegmentKeys = []) {
  const set = new Set(bookingSegmentKeys);
  return requestedSegmentKeys.some((key) => set.has(key));
}

function isPendingHoldActive(booking) {
  if (
    booking?.bookingStatus !== "pending_payment" ||
    booking?.paymentStatus !== "pending"
  ) {
    return false;
  }

  const createdAtMs = new Date(booking.createdAt).getTime();
  if (!Number.isFinite(createdAtMs)) return false;

  return Date.now() - createdAtMs <= PAYMENT_HOLD_MINUTES * 60 * 1000;
}

function isBlockingBooking(booking) {
  if (booking?.bookingStatus === "booked" && booking?.paymentStatus === "paid") {
    return true;
  }

  return isPendingHoldActive(booking);
}

function uniqueSeatNumbers(seatNumbers = []) {
  return [
    ...new Set(
      seatNumbers
        .map((seat) => String(seat).trim().toUpperCase())
        .filter(Boolean)
    ),
  ];
}

function sameStringArray(a = [], b = []) {
  if (a.length !== b.length) return false;

  const left = [...a].map(String).sort();
  const right = [...b].map(String).sort();

  return left.every((value, index) => value === right[index]);
}

function resolveJourneyStops(schedule, pickupLabel, dropoffLabel) {
  const stopTimes = Array.isArray(schedule?.stopTimes) ? schedule.stopTimes : [];

  const pickup = stopTimes.find(
    (stop) => normalizeLabel(stop?.label) === normalizeLabel(pickupLabel)
  );

  const dropoff = stopTimes.find(
    (stop) => normalizeLabel(stop?.label) === normalizeLabel(dropoffLabel)
  );

  if (!pickup) {
    throw new HttpError(400, "Pickup stop not found in selected schedule");
  }

  if (!dropoff) {
    throw new HttpError(400, "Dropoff stop not found in selected schedule");
  }

  if (pickup.stopIndex >= dropoff.stopIndex) {
    throw new HttpError(400, "Pickup stop must come before dropoff stop");
  }

  return { pickup, dropoff };
}

function calculateSegmentDistance(stopTimes, pickupIndex, dropoffIndex) {
  let total = 0;

  for (let i = pickupIndex; i < dropoffIndex; i += 1) {
    const currentPoint = stopTimes[i];
    const nextPoint = stopTimes[i + 1];

    if (!currentPoint || !nextPoint) continue;
    total += getDistanceKm(currentPoint, nextPoint);
  }

  return Number(total.toFixed(1));
}

async function findConflictingBookings({
  scheduleId,
  travelDate,
  requestedSegmentKeys,
  requestedSeatNumbers = [],
  excludeBookingId = null,
}) {
  const query = {
    scheduleId,
    travelDate,
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const bookings = await BusBooking.find(query).lean();

  return bookings.filter((booking) => {
    if (!isBlockingBooking(booking)) return false;
    if (!hasOverlap(booking.segmentKeys, requestedSegmentKeys)) return false;

    if (!requestedSeatNumbers.length) return true;

    return booking.seatNumbers.some((seat) =>
      requestedSeatNumbers.includes(String(seat).trim().toUpperCase())
    );
  });
}

export async function getBusSeatAvailability(req, res, next) {
  try {
    const { scheduleId, travelDate, pickupLabel, dropoffLabel } = req.query || {};

    if (!scheduleId) throw new HttpError(400, "scheduleId is required");
    if (!travelDate) throw new HttpError(400, "travelDate is required");
    if (!pickupLabel) throw new HttpError(400, "pickupLabel is required");
    if (!dropoffLabel) throw new HttpError(400, "dropoffLabel is required");

    const schedule = await BusSchedule.findById(scheduleId).lean();
    if (!schedule) {
      throw new HttpError(404, "Bus schedule not found");
    }

    const selectedDay = getTravelDayOfWeek(travelDate);
    if (selectedDay !== schedule.dayOfWeek) {
      throw new HttpError(400, "Selected date does not match this schedule day");
    }

    const { pickup, dropoff } = resolveJourneyStops(
      schedule,
      pickupLabel,
      dropoffLabel
    );

    const requestedSegmentKeys = buildSegmentKeys(
      pickup.stopIndex,
      dropoff.stopIndex
    );

    const bookings = await BusBooking.find({
      scheduleId,
      travelDate,
    }).lean();

    const bookedSeatsSet = new Set();
    const pendingSeatsSet = new Set();

    for (const booking of bookings) {
      const overlaps = hasOverlap(booking.segmentKeys || [], requestedSegmentKeys);
      if (!overlaps) continue;

      const seats = Array.isArray(booking.seatNumbers)
        ? booking.seatNumbers.map((seat) => String(seat).trim().toUpperCase())
        : [];

      const isBooked =
        booking.bookingStatus === "booked" &&
        booking.paymentStatus === "paid";

      const isPending =
        booking.bookingStatus === "pending_payment" &&
        booking.paymentStatus === "pending" &&
        isPendingHoldActive(booking);

      if (isBooked) {
        seats.forEach((seat) => bookedSeatsSet.add(seat));
      } else if (isPending) {
        seats.forEach((seat) => pendingSeatsSet.add(seat));
      }
    }

    const bookedSeats = [...bookedSeatsSet].sort();
    const pendingSeats = [...pendingSeatsSet]
      .filter((seat) => !bookedSeatsSet.has(seat))
      .sort();

    const unavailableSeats = [...new Set([...bookedSeats, ...pendingSeats])].sort();

    return res.json({
      ok: true,
      requestedSegmentKeys,
      bookedSeats,
      pendingSeats,
      unavailableSeats,
      pickupStop: pickup,
      dropoffStop: dropoff,
    });
  } catch (err) {
    next(err);
  }
}

export async function createBusBookingCheckout(req, res, next) {
  try {
    const passengerId = getUserId(req);
    if (!passengerId) {
      throw new HttpError(401, "Unauthorized");
    }

    const {
      scheduleId,
      travelDate,
      pickupLabel,
      dropoffLabel,
      seatNumbers = [],
    } = req.body || {};

    if (!scheduleId) throw new HttpError(400, "scheduleId is required");
    if (!travelDate) throw new HttpError(400, "travelDate is required");
    if (!pickupLabel) throw new HttpError(400, "pickupLabel is required");
    if (!dropoffLabel) throw new HttpError(400, "dropoffLabel is required");

    const cleanedSeatNumbers = uniqueSeatNumbers(seatNumbers);

    if (!cleanedSeatNumbers.length) {
      throw new HttpError(400, "Select at least one seat");
    }

    const schedule = await BusSchedule.findById(scheduleId)
      .populate("routeId")
      .populate("busId")
      .lean();

    if (!schedule) {
      throw new HttpError(404, "Bus schedule not found");
    }

    const selectedDay = getTravelDayOfWeek(travelDate);
    if (selectedDay !== schedule.dayOfWeek) {
      throw new HttpError(400, "Selected date does not match this schedule day");
    }

    const { pickup, dropoff } = resolveJourneyStops(
      schedule,
      pickupLabel,
      dropoffLabel
    );

    const requestedSegmentKeys = buildSegmentKeys(
      pickup.stopIndex,
      dropoff.stopIndex
    );

    const existingPending = await BusBooking.findOne({
      passengerId,
      scheduleId,
      travelDate,
      bookingStatus: "pending_payment",
      paymentStatus: "pending",
    }).sort({ createdAt: -1 });

    if (existingPending && isPendingHoldActive(existingPending)) {
      const sameSeats = sameStringArray(
        existingPending.seatNumbers || [],
        cleanedSeatNumbers
      );

      const sameSegments = sameStringArray(
        existingPending.segmentKeys || [],
        requestedSegmentKeys
      );

      if (sameSeats && sameSegments) {
        return res.status(200).json({
          ok: true,
          message: "Reusing existing pending booking",
          booking: existingPending,
        });
      }
    }

    const conflicts = await findConflictingBookings({
      scheduleId,
      travelDate,
      requestedSegmentKeys,
      requestedSeatNumbers: cleanedSeatNumbers,
      excludeBookingId: existingPending?._id || null,
    });

    if (conflicts.length > 0) {
      const conflictingSeats = [
        ...new Set(
          conflicts.flatMap((booking) =>
            booking.seatNumbers.filter((seat) =>
              cleanedSeatNumbers.includes(String(seat).trim().toUpperCase())
            )
          )
        ),
      ].sort();

      throw new HttpError(
        409,
        `These seats are no longer available for the selected journey: ${conflictingSeats.join(", ")}`
      );
    }

    const stopTimes = Array.isArray(schedule.stopTimes) ? schedule.stopTimes : [];
    const passengerDistanceKm = calculateSegmentDistance(
      stopTimes,
      pickup.stopIndex,
      dropoff.stopIndex
    );

    const fare = calculateBusFare(
      schedule?.busId?.busType || "Normal",
      passengerDistanceKm
    );

    const totalAmountLkr = fare.fareLkr * cleanedSeatNumbers.length;

    const booking = await BusBooking.create({
      scheduleId: schedule._id,
      routeId: schedule.routeId?._id,
      busId: schedule.busId?._id,
      passengerId,
      passengerSnapshot: {
        name: req.user?.name || req.user?.fullName || "",
        email: req.user?.email || "",
        role: req.user?.role || "",
      },
      travelDate,
      dayOfWeek: selectedDay,
      pickupStop: {
        label: pickup.label,
        stopIndex: pickup.stopIndex,
        time: pickup.time || "",
      },
      dropoffStop: {
        label: dropoff.label,
        stopIndex: dropoff.stopIndex,
        time: dropoff.time || "",
      },
      seatNumbers: cleanedSeatNumbers,
      segmentKeys: requestedSegmentKeys,
      farePerSeatLkr: fare.fareLkr,
      totalAmountLkr,
      bookingStatus: "pending_payment",
      paymentStatus: "pending",
      journeySnapshot: {
        routeNumber: schedule?.routeId?.routeNumber || "",
        routeLabel: `${schedule?.routeId?.start?.label || ""} → ${schedule?.routeId?.end?.label || ""}`,
        busNumber: schedule?.busId?.plateNumber || "",
        busType: schedule?.busId?.busType || "",
        passengerDistanceKm,
        farePerSeatLkr: fare.fareLkr,
        totalAmountLkr,
        stopTimes: stopTimes.map((stop) => ({
          stopIndex: stop.stopIndex,
          label: stop.label,
          time: stop.time,
        })),
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Bus booking created. Proceed to payment.",
      booking,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyBusBookings(req, res, next) {
  try {
    const passengerId = getUserId(req);
    if (!passengerId) {
      throw new HttpError(401, "Unauthorized");
    }

    const bookings = await BusBooking.find({ passengerId })
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

export async function getMyBusBookingById(req, res, next) {
  try {
    const passengerId = getUserId(req);
    if (!passengerId) {
      throw new HttpError(401, "Unauthorized");
    }

    const booking = await BusBooking.findById(req.params.id).lean();
    if (!booking) {
      throw new HttpError(404, "Bus booking not found");
    }

    if (String(booking.passengerId) !== passengerId) {
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

export async function cancelMyBusBooking(req, res, next) {
  try {
    const passengerId = getUserId(req);
    if (!passengerId) {
      throw new HttpError(401, "Unauthorized");
    }

    const booking = await BusBooking.findById(req.params.id);
    if (!booking) {
      throw new HttpError(404, "Bus booking not found");
    }

    if (String(booking.passengerId) !== passengerId) {
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
      message: "Bus booking cancelled",
      booking,
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadMyBusTicketPdf(req, res, next) {
    try {
      const passengerId = getUserId(req);
      if (!passengerId) {
        throw new HttpError(401, "Unauthorized");
      }
  
      const booking = await BusBooking.findById(req.params.id).lean();
      if (!booking) {
        throw new HttpError(404, "Bus booking not found");
      }
  
      const isOwner = String(booking.passengerId) === passengerId;
      const isAdmin = req.user?.role === "admin";
  
      if (!isOwner && !isAdmin) {
        throw new HttpError(403, "Not allowed");
      }
  
      if (booking.paymentStatus !== "paid" || booking.bookingStatus !== "booked") {
        throw new HttpError(409, "Only paid and confirmed bus tickets can be downloaded");
      }
  
      const pdfBuffer = await generateBusTicketPdfBuffer(booking);
  
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="DropMe-Bus-Ticket-${booking._id}.pdf"`
      );
      res.setHeader("Cache-Control", "no-store");
  
      return res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }