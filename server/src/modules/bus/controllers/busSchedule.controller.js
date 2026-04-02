// server/src/modules/bus/controllers/busSchedule.controller.js
import mongoose from "mongoose";
import BusRoute from "../models/BusRoute.js";
import BusSchedule from "../models/BusSchedule.js";


import * as BusModel from "../../../models/Bus.js";
const Bus = BusModel.default || BusModel.Bus || BusModel.bus;
if (!Bus) {
  throw new Error(
    "Bus model export not found. Please export default Bus OR export const Bus in server/src/models/Bus.js"
  );
}

function orderedStops(route, direction) {
  const stopsSorted = [...(route.stops || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );
  const base = [route.start, ...stopsSorted, route.end].filter(Boolean);
  return direction === "B_TO_A" ? [...base].reverse() : base;
}

function isHHMM(v) {
  return typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}

/**
 * GET /api/bus/routes/:routeId/buses
 * NOTE: This assumes Bus model has a field routeId.
 * If your Bus model uses a different field name (e.g., busRouteId), change filter below.
 */
export async function getBusesForRoute(req, res, next) {
  try {
    const { routeId } = req.params;
    if (!mongoose.isValidObjectId(routeId)) {
      return res.status(400).json({ ok: false, message: "Invalid routeId" });
    }

    // ⚠️ Adjust this filter if your Bus schema doesn't have `routeId`
    const buses = await Bus.find({ routeId }).sort({ createdAt: -1 });

    res.json({ ok: true, buses });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/bus/routes/:routeId/schedules
 */
export async function getSchedulesForRoute(req, res, next) {
  try {
    const { routeId } = req.params;
    if (!mongoose.isValidObjectId(routeId)) {
      return res.status(400).json({ ok: false, message: "Invalid routeId" });
    }

    const schedules = await BusSchedule.find({ routeId })
      .populate("busId")
      .sort({ dayOfWeek: 1, direction: 1, createdAt: -1 });

    res.json({ ok: true, schedules });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/bus/routes/:routeId/schedules
 * Upsert schedule by (routeId + busId + direction + dayOfWeek)
 */
export async function upsertSchedule(req, res, next) {
  try {
    const { routeId } = req.params;
    const { busId, direction, dayOfWeek, times } = req.body || {};

    if (!mongoose.isValidObjectId(routeId)) {
      return res.status(400).json({ ok: false, message: "Invalid routeId" });
    }
    if (!mongoose.isValidObjectId(busId)) {
      return res.status(400).json({ ok: false, message: "Invalid busId" });
    }
    
    if (!["A_TO_B", "B_TO_A"].includes(direction)) {
      return res.status(400).json({
        ok: false,
        message: "direction must be A_TO_B or B_TO_A",
      });
    }
    if (typeof dayOfWeek !== "number" || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({
        ok: false,
        message: "dayOfWeek must be a number between 0..6",
      });
    }
    if (!Array.isArray(times)) {
      return res.status(400).json({ ok: false, message: "times must be an array" });
    }

    // Load route to build stopTimes (label/lat/lng)
    const route = await BusRoute.findById(routeId);
    if (!route) return res.status(404).json({ ok: false, message: "Route not found" });

    const stops = orderedStops(route, direction);

    // Validate times -> map by stopIndex
    const timeMap = new Map();
    for (const t of times) {
      if (typeof t?.stopIndex !== "number") continue;

      if (!isHHMM(t?.time)) {
        return res.status(400).json({
          ok: false,
          message: "Time format must be HH:mm (e.g., 06:30)",
        });
      }
      timeMap.set(t.stopIndex, t.time);
    }

    const stopTimes = stops.map((s, idx) => ({
      stopIndex: idx,
      label: s.label,
      lat: Number(s.lat),
      lng: Number(s.lng),
      time: timeMap.get(idx) || "00:00",
    }));

    const schedule = await BusSchedule.findOneAndUpdate(
      { routeId, busId, direction, dayOfWeek },
      { routeId, busId, direction, dayOfWeek, stopTimes },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate("busId");

    res.json({ ok: true, schedule });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        ok: false,
        message: "Schedule already exists for this route + bus + direction + day",
      });
    }
    next(err);
  }
}

/**
 * DELETE /api/bus/schedules/:id
 */
export async function deleteSchedule(req, res, next) {
  try {
    const deleted = await BusSchedule.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, message: "Schedule not found" });
    res.json({ ok: true, message: "Schedule deleted" });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/bus/bus-owner/schedules
 * NOTE: This assumes Bus has ownerId that matches req.user._id
 * If your Bus model uses a different owner field, change filter below.
 */
export async function getOwnerSchedules(req, res, next) {
  try {
    const ownerId = req.user?._id || req.user?.id;
    if (!ownerId) return res.status(401).json({ ok: false, message: "Unauthorized" });

    // ⚠️ Adjust if your Bus schema uses a different owner field name
    const buses = await Bus.find({ ownerId }).select("_id");
    const busIds = buses.map((b) => b._id);

    const schedules = await BusSchedule.find({ busId: { $in: busIds } })
      .populate("routeId")
      .populate("busId")
      .sort({ createdAt: -1 });

    res.json({ ok: true, schedules });
  } catch (err) {
    next(err);
  }
}