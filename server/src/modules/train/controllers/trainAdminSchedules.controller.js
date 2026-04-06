import mongoose from "mongoose";
import { TrainSchedule } from "../models/TrainSchedule.js";
import { Station } from "../models/Station.js";
import { HttpError } from "../../../utils/httpError.js";

/**
 * Distance (km) between two lat/lng points.
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Backend contract:
 * - min 2 stops
 * - unique order
 * - each stop must have stationId + departureTime
 */
function validateStops(stops) {
  if (!Array.isArray(stops) || stops.length < 2) {
    throw new HttpError(400, "At least 2 stops required");
  }

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
 * Weekly timetable validator (Mon–Sun)
 * - must be object
 * - each day must be array (can be empty)
 * - if day array present: each row must have stationId + order + departureTime
 */
function validateWeeklyTimetable(weeklyTimetable) {
  if (weeklyTimetable === null || typeof weeklyTimetable !== "object") {
    throw new HttpError(400, "weeklyTimetable must be an object");
  }

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (const d of DAYS) {
    const rows = weeklyTimetable[d];
    if (rows === undefined) continue; // allow partial day updates if you want

    if (!Array.isArray(rows)) {
      throw new HttpError(400, `weeklyTimetable.${d} must be an array`);
    }

    for (const r of rows) {
      if (!r.stationId) throw new HttpError(400, `weeklyTimetable.${d}: stationId required`);
      if (!Number.isFinite(Number(r.order)))
        throw new HttpError(400, `weeklyTimetable.${d}: order must be numeric`);
      if (!r.departureTime)
        throw new HttpError(400, `weeklyTimetable.${d}: departureTime required`);
    }

    // optional: order uniqueness per day
    const orders = rows.map((x) => Number(x.order));
    if (new Set(orders).size !== orders.length) {
      throw new HttpError(400, `weeklyTimetable.${d}: order must be unique`);
    }
  }
}

/**
 * Computes segments + totalDistanceKm based on station coordinates.
 */
async function computeSegments(stops) {
  const ordered = [...stops].sort((a, b) => Number(a.order) - Number(b.order));

  const ids = ordered.map((s) => new mongoose.Types.ObjectId(s.stationId));
  const stationDocs = await Station.find({ _id: { $in: ids } }).lean();
  const stationById = new Map(stationDocs.map((s) => [String(s._id), s]));

  const segments = [];
  let total = 0;

  for (let i = 0; i < ordered.length - 1; i++) {
    const a = stationById.get(String(ordered[i].stationId));
    const b = stationById.get(String(ordered[i + 1].stationId));
    if (!a || !b) throw new HttpError(400, "One or more stations not found");

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

export async function listSchedules(req, res, next) {
  try {
    const q = TrainSchedule.find().sort({ createdAt: -1 });
    const schedules = await applyTimetablePopulate(q).lean();
    res.json({ schedules });
  } catch (e) {
    next(e);
  }
}

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

export async function createSchedule(req, res, next) {
  try {
    const { trainName, trainNo, seatCapacity, stops, active, weeklyTimetable } = req.body;

    if (!trainNo) throw new HttpError(400, "trainNo is required");

    const cap = Number(seatCapacity);
    if (!Number.isFinite(cap) || cap < 1) {
      throw new HttpError(400, "seatCapacity must be >= 1");
    }

    validateStops(stops);
    const { segments, totalDistanceKm } = await computeSegments(stops);

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

export async function updateSchedule(req, res, next) {
  try {
    const doc = await TrainSchedule.findById(req.params.id);
    if (!doc) throw new HttpError(404, "Schedule not found");

    const { trainName, trainNo, seatCapacity, stops, active, weeklyTimetable } = req.body;

    // ✅ allow partial updates (timetables page sends only weeklyTimetable)
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

    if (stops !== undefined) {
      validateStops(stops);
      const { segments, totalDistanceKm } = await computeSegments(stops);
      doc.stops = stops;
      doc.segments = segments;
      doc.totalDistanceKm = totalDistanceKm;
    }

    // ✅ THIS is the missing piece for TrainTimetablesPage
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

export async function deleteSchedule(req, res, next) {
  try {
    const out = await TrainSchedule.findByIdAndDelete(req.params.id);
    if (!out) throw new HttpError(404, "Schedule not found");
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
