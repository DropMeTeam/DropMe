export function getLatLng(station) {
  if (!station) return null;

  const pick = (lat, lng) => {
    const la = typeof lat === "string" ? Number(lat) : lat;
    const lo = typeof lng === "string" ? Number(lng) : lng;
    if (Number.isFinite(la) && Number.isFinite(lo)) return { lat: la, lng: lo };
    return null;
  };

  return (
    pick(station.lat, station.lng) ||
    pick(station?.location?.lat, station?.location?.lng) ||
    pick(station?.coords?.lat, station?.coords?.lng) ||
    pick(station?.coordinate?.lat, station?.coordinate?.lng) ||
    pick(station?.coordinates?.lat, station?.coordinates?.lng) ||
    pick(station?.latitude, station?.longitude)
  );
}

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

// Approx distance to AB line corridor (good for suggesting “between” stations)
export function distanceToSegmentKm(p, a, b) {
  const ax = a.lng, ay = a.lat;
  const bx = b.lng, by = b.lat;
  const px = p.lng, py = p.lat;

  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;

  const ab2 = abx * abx + aby * aby;
  const t = ab2 === 0 ? 0 : clamp((apx * abx + apy * aby) / ab2, 0, 1);

  const cx = ax + abx * t;
  const cy = ay + aby * t;

  const kmPerDegLat = 111;
  const kmPerDegLng = 111 * Math.cos(((ay + by) / 2) * (Math.PI / 180));

  const dx = (px - cx) * kmPerDegLng;
  const dy = (py - cy) * kmPerDegLat;

  return Math.sqrt(dx * dx + dy * dy);
}

export function alongFactor(p, a, b) {
  const ax = a.lng, ay = a.lat;
  const bx = b.lng, by = b.lat;
  const px = p.lng, py = p.lat;

  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;

  const ab2 = abx * abx + aby * aby;
  if (ab2 === 0) return 0;
  return clamp((apx * abx + apy * aby) / ab2, 0, 1);
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(aa));
}
