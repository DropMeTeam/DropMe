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
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Validate train stops before saving/updating schedule.
 *
 * Rules:
 * - Must have at least 2 stops
 * - Each stop must have:
 *    - stationId
 *    - departureTime
 *    - numeric order
 * - Order values must be unique
 */
function validateStops(stops) {
  if (!Array.isArray(stops) || stops.length < 2) {
    throw new HttpError(400, "At least 2 stops required");
  }

  // Convert order values to numbers early
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
 * Compute route segments and total distance using station coordinates.
 *
 * Output:
 * - segments: [{ fromStationId, toStationId, distanceKm }]
 * - totalDistanceKm
 */
async function computeSegments(stops) {
  // Sort stops by order
  const ordered = [...stops].sort((a, b) => Number(a.order) - Number(b.order));

  // Convert stationIds to ObjectIds
  const ids = ordered.map((s) => new mongoose.Types.ObjectId(s.stationId));

  // Get station documents from DB
  const stationDocs = await Station.find({ _id: { $in: ids } }).lean();

  // Map station by ID for quick lookup
  const stationById = new Map(stationDocs.map((s) => [String(s._id), s]));

  const segments = [];
  let total = 0;

  // Loop through each consecutive pair of stops
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

    if (![aLat, aLng, bLat, bLng].every(Number.isFinite)) {
      throw new HttpError(
        400,
        `Invalid station coordinates. Check lat/lng for "${a.name}" or "${b.name}".`
      );
    }

    // Calculate distance between current stop and next stop
    const d = haversineKm(aLat, aLng, bLat, bLng);

    if (!Number.isFinite(d)) {
      throw new HttpError(
        400,
        "Distance calculation failed (NaN). Check station coordinates."
      );
    }

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
 * Helper function to populate referenced station details
 * inside stops and weekly timetable fields.
 */
function applyTimetablePopulate(q) {
  return q
    .populate("stops.stationId", "name location")
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

    if (!schedule) throw new HttpError(404, "Schedule not found");

    res.json({ schedule });
  } catch (e) {
    next(e);
  }
}

/**
 * POST: Create a new train schedule
 */
export async function createSchedule(req, res, next) {
  try {
    const { trainName, trainNo, seatCapacity, stops, active } = req.body;

    if (!trainNo) {
      throw new HttpError(400, "trainNo is required");
    }

    const cap = Number(seatCapacity);
    if (!Number.isFinite(cap) || cap < 1) {
      throw new HttpError(400, "seatCapacity must be >= 1");
    }

    // Validate stops before calculating distance
    validateStops(stops);

    // Build segments and total distance
    const { segments, totalDistanceKm } = await computeSegments(stops);

    const schedule = await TrainSchedule.create({
      trainName: trainName || "",
      trainNo: String(trainNo).trim(),
      seatCapacity: cap,
      stops,
      segments,
      totalDistanceKm,
      active: active ?? true,
      createdBy: req.user?.sub,
    });

    res.status(201).json({ schedule });
  } catch (e) {
    next(e);
  }
}

/**
 * PATCH/PUT: Update an existing train schedule
 */
export async function updateSchedule(req, res, next) {
  try {
    const doc = await TrainSchedule.findById(req.params.id);

    if (!doc) throw new HttpError(404, "Schedule not found");

    const { trainName, trainNo, seatCapacity, stops, active } = req.body;

    // Update basic fields only if provided
    if (trainNo !== undefined) doc.trainNo = String(trainNo).trim();
    if (trainName !== undefined) doc.trainName = trainName || "";

    if (seatCapacity !== undefined) {
      const cap = Number(seatCapacity);
      if (!Number.isFinite(cap) || cap < 1) {
        throw new HttpError(400, "seatCapacity must be >= 1");
      }
      doc.seatCapacity = cap;
    }

    if (active !== undefined) doc.active = !!active;

    // If stops changed, revalidate and recalculate segments/distance
    if (stops !== undefined) {
      validateStops(stops);

      const { segments, totalDistanceKm } = await computeSegments(stops);

      doc.stops = stops;
      doc.segments = segments;
      doc.totalDistanceKm = totalDistanceKm;
    }

    await doc.save();

    res.json({ schedule: doc });
  } catch (e) {
    next(e);
  }
}

/**
 * DELETE: Remove a train schedule by ID
 */
export async function deleteSchedule(req, res, next) {
  try {
    const out = await TrainSchedule.findByIdAndDelete(req.params.id);

    if (!out) throw new HttpError(404, "Schedule not found");

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}