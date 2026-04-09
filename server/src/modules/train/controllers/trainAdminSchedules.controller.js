import mongoose from "mongoose";
import { TrainSchedule } from "../models/TrainSchedule.js";
import { Station } from "../models/Station.js";
import { HttpError } from "../../../utils/httpError.js";

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
  if (new Set(orders).size !== orders.length) {
    throw new HttpError(400, "Stop order values must be unique");
  }
}

function validateWeeklyTimetable(weeklyTimetable) {
  if (weeklyTimetable === null || typeof weeklyTimetable !== "object") {
    throw new HttpError(400, "weeklyTimetable must be an object");
  }

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (const d of DAYS) {
    const rows = weeklyTimetable[d];

    if (rows === undefined) continue;

    if (!Array.isArray(rows)) {
      throw new HttpError(400, `weeklyTimetable.${d} must be an array`);
    }

    for (const r of rows) {
      if (!r.stationId) throw new HttpError(400, `weeklyTimetable.${d}: stationId required`);
      if (!Number.isFinite(Number(r.order))) {
        throw new HttpError(400, `weeklyTimetable.${d}: order must be numeric`);
      }
      if (!r.departureTime) {
        throw new HttpError(400, `weeklyTimetable.${d}: departureTime required`);
      }
    }

    const orders = rows.map((x) => Number(x.order));
    if (new Set(orders).size !== orders.length) {
      throw new HttpError(400, `weeklyTimetable.${d}: order must be unique`);
    }
  }
}

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

    const distanceKm = Math.round(haversineKm(aLat, aLng, bLat, bLng) * 1000) / 1000;

    segments.push({
      fromStationId: ordered[i].stationId,
      toStationId: ordered[i + 1].stationId,
      distanceKm,
      fareLkr: 0,
    });

    total += distanceKm;
  }

  return {
    segments,
    totalDistanceKm: Math.round(total * 1000) / 1000,
  };
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
    const {
      trainName,
      trainNo,
      seatCapacity,
      stops,
      active,
      weeklyTimetable,
      segmentFares,
    } = req.body;

    if (!trainNo) throw new HttpError(400, "trainNo is required");

    const cap = Number(seatCapacity);
    if (!Number.isFinite(cap) || cap < 1) {
      throw new HttpError(400, "seatCapacity must be >= 1");
    }

    validateStops(stops);
    const { segments, totalDistanceKm } = await computeSegments(stops);

    if (!Array.isArray(segmentFares) || segmentFares.length !== segments.length) {
      throw new HttpError(400, `Exactly ${segments.length} segment fares are required`);
    }

    for (let i = 0; i < segments.length; i++) {
      const fare = Number(segmentFares[i]);
      if (!Number.isFinite(fare) || fare < 0) {
        throw new HttpError(400, `Invalid fare for segment ${i + 1}`);
      }
      segments[i].fareLkr = fare;
    }

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

    const {
      trainName,
      trainNo,
      seatCapacity,
      stops,
      active,
      weeklyTimetable,
      segmentFares,
    } = req.body;

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

      if (!Array.isArray(segmentFares) || segmentFares.length !== segments.length) {
        throw new HttpError(
          400,
          `Stops changed. Exactly ${segments.length} segment fares are required`
        );
      }

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
      doc.markModified("stops");
      doc.markModified("segments");
    } else if (segmentFares !== undefined) {
      if (!Array.isArray(segmentFares) || segmentFares.length !== doc.segments.length) {
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

      doc.markModified("segments");
    }

    if (weeklyTimetable !== undefined) {
      validateWeeklyTimetable(weeklyTimetable);
      doc.weeklyTimetable = weeklyTimetable;
      doc.markModified("weeklyTimetable");
    }

    await doc.save();

    const q = TrainSchedule.findById(doc._id);
    const schedule = await applyTimetablePopulate(q).lean();

    res.json({ schedule });
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