import BusRoute from "../models/BusRoute.js";

function validatePoint(p, name) {
  if (!p || typeof p !== "object") throw new Error(`${name} is required`);
  if (!p.label || typeof p.label !== "string") throw new Error(`${name}.label is required`);
  if (typeof p.lat !== "number" || typeof p.lng !== "number")
    throw new Error(`${name}.lat and ${name}.lng must be numbers`);
}

export async function createBusRoute(payload) {
  const { routeNumber, routeType, start, end, stops = [] } = payload;

  if (!routeNumber || typeof routeNumber !== "string") throw new Error("routeNumber is required");
  if (!["NORMAL", "EXPRESS"].includes(routeType)) throw new Error("routeType must be NORMAL or EXPRESS");

  validatePoint(start, "start");
  validatePoint(end, "end");

  // Stops: appended order
  if (!Array.isArray(stops)) throw new Error("stops must be an array");

  const maxStops = routeType === "EXPRESS" ? 10 : 50;
  if (stops.length > maxStops) throw new Error(`${routeType} routes cannot exceed ${maxStops} stops`);

  const normalizedStops = stops.map((s, idx) => ({
    order: idx + 1,
    label: String(s.label || "").trim(),
    lat: Number(s.lat),
    lng: Number(s.lng)
  }));

  if (normalizedStops.some(s => !s.label || Number.isNaN(s.lat) || Number.isNaN(s.lng))) {
    throw new Error("Each stop must include label, lat, lng");
  }

  // uniqueness check
  const existing = await BusRoute.findOne({ routeNumber: routeNumber.trim() });
  if (existing) throw new Error("Route number already exists");

  const doc = await BusRoute.create({
    routeNumber: routeNumber.trim(),
    routeType,
    start: { label: start.label.trim(), lat: start.lat, lng: start.lng },
    end: { label: end.label.trim(), lat: end.lat, lng: end.lng },
    stops: normalizedStops
  });

  return doc;
}

export async function listBusRoutes({ routeType } = {}) {
  const filter = {};
  if (routeType && ["NORMAL", "EXPRESS"].includes(routeType)) filter.routeType = routeType;
  return BusRoute.find(filter).sort({ createdAt: -1 });
}
