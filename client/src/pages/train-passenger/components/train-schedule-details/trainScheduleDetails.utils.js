export const DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function formatTime12(time, fallback = "--") {
  if (!time || typeof time !== "string") return fallback;

  const normalized = time.trim();

  if (!normalized) return fallback;

  if (/am|pm/i.test(normalized)) {
    return normalized.toUpperCase();
  }

  if (!normalized.includes(":")) {
    return normalized;
  }

  const [hourRaw, minuteRaw] = normalized.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return normalized;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatDistanceKm(distance) {
  const numericDistance = Number(distance);

  if (!Number.isFinite(numericDistance)) {
    return "0 km";
  }

  return `${new Intl.NumberFormat().format(numericDistance)} km`;
}

export function buildLocationLabel(location) {
  if (!location || typeof location !== "object") {
    return "No location available";
  }

  const lat = Number(location.lat);
  const lng = Number(location.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return "No location available";
  }

  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function getStopBadge(index, totalStops) {
  if (index === 0) {
    return {
      label: "Origin",
      className: "border-emerald-400/25 bg-emerald-500/12 text-emerald-300",
    };
  }

  if (index === totalStops - 1) {
    return {
      label: "Destination",
      className: "border-blue-400/25 bg-blue-500/12 text-blue-200",
    };
  }

  return null;
}

export function getStopIndicatorClasses(index, totalStops) {
  if (index === 0) {
    return "border-emerald-300/60 bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]";
  }

  if (index === totalStops - 1) {
    return "border-blue-300/60 bg-blue-400 shadow-[0_0_0_6px_rgba(59,130,246,0.18)]";
  }

  return "border-slate-500/70 bg-slate-600 shadow-[0_0_0_6px_rgba(100,116,139,0.10)]";
}
