import polyline from "@mapbox/polyline";

const OSRM = "https://router.project-osrm.org";

// Existing function (keep — other pages may use it)
export async function getRoute(from, to) {
  const url =
    `${OSRM}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=polyline&alternatives=false&steps=false`;

  const res = await fetch(url);
  const data = await res.json();
  if (!data?.routes?.length) throw new Error("No route found");

  const r = data.routes[0];
  const pathLatLng = polyline.decode(r.geometry).map(([lat, lng]) => [lat, lng]);

  return {
    distanceMeters: r.distance,
    durationSeconds: r.duration,
    pathLatLng
  };
}

/**
 * NEW: Build a road-following route for multiple points:
 * points = [start, ...stops, end]
 * Returns { latlngs } where latlngs = [[lat,lng], ...]
 */
export async function getRoadRoute(points) {
  if (!Array.isArray(points) || points.length < 2) return { latlngs: [] };

  // OSRM supports multiple waypoints: lng,lat;lng,lat;...
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");

  const url =
    `${OSRM}/route/v1/driving/${coords}` +
    `?overview=full&geometries=polyline&alternatives=false&steps=false`;

  const res = await fetch(url);
  const data = await res.json();
  if (!data?.routes?.length) throw new Error("No route found");

  const r = data.routes[0];
  const latlngs = polyline.decode(r.geometry).map(([lat, lng]) => [lat, lng]);

  return { latlngs };
}