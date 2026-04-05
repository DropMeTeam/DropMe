import mongoose from "mongoose";
import { TrainSchedule } from "../models/TrainSchedule.js";
import { Station } from "../models/Station.js";
import { HttpError } from "../../../utils/httpError.js";

/**
 * Calculate distance in kilometers between two latitude/longitude points
 * using the Haversine formula.
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Validate the main stops array before saving/updating.
 *
 * Rules:
 * - Must be an array
 * - Must contain at least 2 stops
 * - Each stop must have:
 *   - stationId
 *   - departureTime
 *   - numeric order
 * - order values must be unique
 */
function validateStops(stops) {
  if (!Array.isArray(stops) || stops.length < 2) {
    throw new HttpError(400, "At least 2 stops required");
  }

  // Convert order values into numbers early
  for (const s of stops) {
    if (s.order !== undefined) s.order = Number(s.order);
  }

  if (stops.some((s) => !s.stationId)) {
    throw new HttpError(400, "Every stop must have stationId");
  }

  if (stops.some((s) => !s.departureTime)) {
    throw new HttpError(400, "Every stop must have departureTime");
  }

  if (stops.some((s) => !Number.isFinite(Number(s.order)))) {
    throw new HttpError(400, "Every stop must have a numeric order");
  }

  const orders = stops.map((s) => Number(s.order));
  const uniqOrders = new Set(orders);

  if (uniqOrders.size !== orders.length) {
    throw new HttpError(400, "Stop order values must be unique");
  }
}

/**
 * Validate weekly timetable object (Mon-Sun).
 *
 * Rules:
 * - Must be an object
 * - Each day must be an array if provided
 * - Each row in a day must have:
 *   - stationId
 *   - numeric order
 *   - departureTime
 * - order must be unique inside each day
 */
function validateWeeklyTimetable(weeklyTimetable) {
  if (weeklyTimetable === null || typeof weeklyTimetable !== "object") {
    throw new HttpError(400, "weeklyTimetable must be an object");
  }

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (const d of DAYS) {
    const rows = weeklyTimetable[d];

    // Allow partial updates (day can be missing)
    if (rows === undefined) continue;

    if (!Array.isArray(rows)) {
      throw new HttpError(400, `weeklyTimetable.${d} must be an array`);
    }

    for (const r of rows) {
      if (!r.stationId) {
        throw new HttpError(400, `weeklyTimetable.${d}: stationId required`);
      }

      if (!Number.isFinite(Number(r.order))) {
        throw new HttpError(400, `weeklyTimetable.${d}: order must be numeric`);
      }

      if (!r.departureTime) {
        throw new HttpError(400, `weeklyTimetable.${d}: departureTime required`);
      }
    }

    // Ensure no duplicate order values for the same day
    const orders = rows.map((x) => Number(x.order));
    if (new Set(orders).size !== orders.length) {
      throw new HttpError(400, `weeklyTimetable.${d}: order must be unique`);
    }
  }
}

/**
 * Compute distance segments between consecutive stops
 * and calculate the total route distance.
 *
 * Returns:
 * - segments: array of route segments
 * - totalDistanceKm: sum of all segment distances
 */
async function computeSegments(stops) {
  // Sort stops by order
  const ordered = [...stops].sort((a, b) => Number(a.order) - Number(b.order));

  // Convert station IDs to ObjectIds
  const ids = ordered.map((s) => new mongoose.Types.ObjectId(s.stationId));

  // Load station documents
  const stationDocs = await Station.find({ _id: { $in: ids } }).lean();

  // Build quick lookup map
  const stationById = new Map(stationDocs.map((s) => [String(s._id), s]));

  const segments = [];
  let total = 0;

  // Compare each stop with the next one
  for (let i = 0; i < ordered.length - 1; i++) {
    const a = stationById.get(String(ordered[i].stationId));
    const b = stationById.get(String(ordered[i + 1].stationId));

    if (!a || !b) {
      throw new HttpError(400, "One or more stations not found");
    }

    const aLat = Number(a.location?.lat);
    const aLng = Number(a.location?.lng);
    const bLat = Number(b.location?.lat);
    const bLng = Number(b.location?.lng);

    // Validate coordinates before distance calculation
    if (![aLat, aLng, bLat, bLng].every(Number.isFinite)) {
      throw new HttpError(
        400,
        `Invalid station coordinates. Check lat/lng for "${a.name}" or "${b.name}".`
      );
    }

    const d = haversineKm(aLat, aLng, bLat, bLng);
    const distanceKm = Math.round(d * 1000) / 1000;

    segments.push({
      fromStationId: ordered[i].stationId,
      toStationId: ordered[i + 1].stationId,
      distanceKm,
    });

    total += distanceKm;
  }

  total = Math.round(total * 1000) / 1000;

  return { segments, totalDistanceKm: total };
}

/**
 * Populate referenced station documents for:
 * - stops
 * - weeklyTimetable day arrays
 */
function applyTimetablePopulate(q) {
  return q
    .populate("stops.stationId", "name location")
    .populate("segments.fromStationId", "name")
    .populate("segments.toStationId", "name")
    .populate("weeklyTimetable.Mon.stationId", "name location")
    .populate("weeklyTimetable.Tue.stationId", "name location")
    .populate("weeklyTimetable.Wed.stationId", "name location")
    .populate("weeklyTimetable.Thu.stationId", "name location")
    .populate("weeklyTimetable.Fri.stationId", "name location")
    .populate("weeklyTimetable.Sat.stationId", "name location")
    .populate("weeklyTimetable.Sun.stationId", "name location");
}

/**
 * GET: List all train schedules
 */
export async function listSchedules(req, res, next) {
  try {
    const q = TrainSchedule.find().sort({ createdAt: -1 });
    const schedules = await applyTimetablePopulate(q).lean();

    res.json({ schedules });
  } catch (e) {
    next(e);
  }
}

/**
 * GET: Get one train schedule by ID
 */
export async function getSchedule(req, res, next) {
  try {
    const q = TrainSchedule.findById(req.params.id);
    const schedule = await applyTimetablePopulate(q).lean();

    if (!schedule) {
      throw new HttpError(404, "Schedule not found");
    }

    res.json({ schedule });
  } catch (e) {
    next(e);
  }
}

/**
 * POST: Create a new train schedule
 *
 * Supports:
 * - basic schedule fields
 * - stops validation
 * - automatic route segment calculation
 * - segment fares validation
 * - optional weeklyTimetable validation
 */
export async function createSchedule(req, res, next) {
  try {
    const {
      trainName,
      trainNo,
      seatCapacity,
      stops,
      active,
      weeklyTimetable,
      segmentFares,
    } = req.body;

    if (!trainNo) {
      throw new HttpError(400, "trainNo is required");
    }

    const cap = Number(seatCapacity);
    if (!Number.isFinite(cap) || cap < 1) {
      throw new HttpError(400, "seatCapacity must be >= 1");
    }

    // Validate and compute route data
    validateStops(stops);
    const { segments, totalDistanceKm } = await computeSegments(stops);

    // Validate segment fares
    if (!Array.isArray(segmentFares) || segmentFares.length !== segments.length) {
      throw new HttpError(
        400,
        `Exactly ${segments.length} segment fares are required`
      );
    }

    // Merge fares into segments
    for (let i = 0; i < segments.length; i++) {
      const fare = Number(segmentFares[i]);
      if (!Number.isFinite(fare) || fare < 0) {
        throw new HttpError(400, `Invalid fare for segment ${i + 1}`);
      }
      segments[i].fareLkr = fare;
    }

    // Validate timetable only if sent
    if (weeklyTimetable !== undefined) {
      validateWeeklyTimetable(weeklyTimetable);
    }

    const schedule = await TrainSchedule.create({
      trainName: trainName || "",
      trainNo: String(trainNo).trim(),
      seatCapacity: cap,
      stops,
      segments,
      totalDistanceKm,
      active: active ?? true,
      weeklyTimetable: weeklyTimetable ?? undefined,
      createdBy: req.user?.sub,
    });

    res.status(201).json({ schedule });
  } catch (e) {
    next(e);
  }
}

/**
 * PATCH/PUT: Update an existing schedule
 *
 * Important:
 * - Allows partial updates
 * - Can update only weeklyTimetable without sending other fields
 * - Recalculates segments only if stops are changed
 * - Updates fares if segmentFares is provided
 */
export async function updateSchedule(req, res, next) {
  try {
    const doc = await TrainSchedule.findById(req.params.id);

    if (!doc) {
      throw new HttpError(404, "Schedule not found");
    }

    const {
      trainName,
      trainNo,
      seatCapacity,
      stops,
      active,
      weeklyTimetable,
      segmentFares,
    } = req.body;

    // Allow updating only provided fields
    if (trainNo !== undefined) doc.trainNo = String(trainNo).trim();
    if (trainName !== undefined) doc.trainName = trainName || "";

    if (seatCapacity !== undefined) {
      const cap = Number(seatCapacity);
      if (!Number.isFinite(cap) || cap < 1) {
        throw new HttpError(400, "seatCapacity must be >= 1");
      }
      doc.seatCapacity = cap;
    }

    if (active !== undefined) {
      doc.active = !!active;
    }

    // If stops are changed, revalidate and recalculate distance
    if (stops !== undefined) {
      validateStops(stops);

      const { segments, totalDistanceKm } = await computeSegments(stops);

      // If stops change, we MUST have new fares or we can't save safely
      if (!Array.isArray(segmentFares) || segmentFares.length !== segments.length) {
        throw new HttpError(
          400,
          `Stops changed. Exactly ${segments.length} segment fares are required`
        );
      }

      // Merge fares
      for (let i = 0; i < segments.length; i++) {
        const fare = Number(segmentFares[i]);
        if (!Number.isFinite(fare) || fare < 0) {
          throw new HttpError(400, `Invalid fare for segment ${i + 1}`);
        }
        segments[i].fareLkr = fare;
      }

      doc.stops = stops;
      doc.segments = segments;
      doc.totalDistanceKm = totalDistanceKm;
    } else if (segmentFares !== undefined) {
      // If only fares are changed, update existing segments
      if (
        !Array.isArray(segmentFares) ||
        segmentFares.length !== doc.segments.length
      ) {
        throw new HttpError(
          400,
          `Exactly ${doc.segments.length} segment fares are required`
        );
      }

      for (let i = 0; i < doc.segments.length; i++) {
        const fare = Number(segmentFares[i]);
        if (!Number.isFinite(fare) || fare < 0) {
          throw new HttpError(400, `Invalid fare for segment ${i + 1}`);
        }
        doc.segments[i].fareLkr = fare;
      }
      // Force Mongoose to see the array change
      doc.markModified("segments");
    }

    // If weeklyTimetable is sent, validate and save it
    if (weeklyTimetable !== undefined) {
      validateWeeklyTimetable(weeklyTimetable);
      doc.weeklyTimetable = weeklyTimetable;
    }

    await doc.save();

    res.json({ schedule: doc });
  } catch (e) {
    next(e);
  }
}

/**
 * DELETE: Remove a schedule by ID
 */
export async function deleteSchedule(req, res, next) {
  try {
    const out = await TrainSchedule.findByIdAndDelete(req.params.id);

    if (!out) {
      throw new HttpError(404, "Schedule not found");
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}