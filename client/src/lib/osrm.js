import polyline from "@mapbox/polyline";

const OSRM = "https://router.project-osrm.org";

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
    pathLatLng,
  };
}
