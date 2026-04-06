import polyline from "@mapbox/polyline";

const OSRM = "https://router.project-osrm.org";

export async function getRoute(from, to) {
  const url =
    `${OSRM}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=polyline&alternatives=false&steps=false`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data?.routes?.length) {
    throw new Error("No route found");
  }

  const r = data.routes[0];
  const pathLatLng = polyline.decode(r.geometry).map(([lat, lng]) => [lat, lng]);

  return {
    distanceMeters: r.distance,
    durationSeconds: r.duration,
    pathLatLng,
  };
}

/**
 * Build a road-following route for multiple points:
 * points = [start, ...stops, end]
 *
 * Returns:
 * {
 *   latlngs: [[lat, lng], ...],
 *   distanceKm: number,
 *   distanceMeters: number,
 *   durationSeconds: number
 * }
 */
export async function getRoadRoute(points) {
  if (!Array.isArray(points) || points.length < 2) {
    return {
      latlngs: [],
      distanceKm: 0,
      distanceMeters: 0,
      durationSeconds: 0,
    };
  }

  // OSRM multi-waypoint coordinates format: lng,lat;lng,lat;...
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");

  const url =
    `${OSRM}/route/v1/driving/${coords}` +
    `?overview=full&geometries=polyline&alternatives=false&steps=false`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data?.routes?.length) {
    throw new Error("No route found");
  }

  const r = data.routes[0];

  // Decode polyline into leaflet-friendly [lat, lng]
  const latlngs = polyline.decode(r.geometry).map(([lat, lng]) => [lat, lng]);

  return {
    latlngs,
    distanceKm: Number((r.distance / 1000).toFixed(2)),
    distanceMeters: r.distance,
    durationSeconds: r.duration,
  };
}