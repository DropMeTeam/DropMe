import BusRoute from "../models/BusRoute.js";
import { createBusRoute, listBusRoutes } from "../services/busRoute.service.js";


export async function createRoute(req, res, next) {
  try {
    const created = await createBusRoute(req.body);
    res.status(201).json({ ok: true, route: created });
  } catch (err) {
    err.status = err.status || 400;
    next(err);
  }
}

export async function getRoutes(req, res, next) {
  try {
    const routes = await listBusRoutes({ routeType: req.query.routeType });
    res.json({ ok: true, routes });
  } catch (err) {
    next(err);
  }
}

export async function getRouteById(req, res, next) {
  try {
    const route = await BusRoute.findById(req.params.id);
    if (!route) return res.status(404).json({ ok: false, message: "Route not found" });
    res.json({ ok: true, route });
  } catch (err) {
    next(err);
  }
}

export async function updateRoute(req, res, next) {
  try {
    const allowed = ["routeNumber", "routeType", "start", "end", "stops"];
    const patch = {};
    for (const k of allowed) if (req.body[k] !== undefined) patch[k] = req.body[k];

    // normalize stop order if stops provided
    if (Array.isArray(patch.stops)) {
      patch.stops = patch.stops.map((s, idx) => ({ ...s, order: idx + 1 }));
    }

    const updated = await BusRoute.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ ok: false, message: "Route not found" });

    res.json({ ok: true, route: updated });
  } catch (err) {
    err.status = err.status || 400;
    next(err);
  }
}

export async function deleteRoute(req, res, next) {
  try {
    const deleted = await BusRoute.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, message: "Route not found" });
    res.json({ ok: true, message: "Route deleted" });
  } catch (err) {
    next(err);
  }
}
