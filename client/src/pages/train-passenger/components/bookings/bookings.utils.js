export function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function formatTime12(time, fallback = "--:--") {
  if (!time || typeof time !== "string" || !time.includes(":")) return fallback;

  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return fallback;

  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${hour12.toString().padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatBookingDate(value, fallback = "--") {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

export function getJourneySnapshot(booking) {
  return booking?.journeySnapshot || {};
}

export function getBookingStatusMeta(booking) {
  const bookingStatus = String(booking?.status || booking?.bookingStatus || "").toLowerCase();
  const paymentStatus = String(booking?.paymentStatus || booking?.payment?.status || "").toLowerCase();
  const isCancelled = Boolean(
    booking?.isCancelled || booking?.cancelledAt || bookingStatus === "cancelled"
  );

  if (isCancelled) {
    return {
      label: "Cancelled",
      chipClass:
        "border-red-500/30 bg-red-500/10 text-red-200",
    };
  }

  if (["paid", "confirmed", "success", "completed"].includes(paymentStatus)) {
    return {
      label: "Confirmed",
      chipClass:
        "border-emerald-500/30 bg-emerald-500/12 text-emerald-200",
    };
  }

  if (["pending", "unpaid", "processing", "reserved"].includes(paymentStatus) || bookingStatus === "pending") {
    return {
      label: "Processing",
      chipClass:
        "border-blue-500/30 bg-blue-500/12 text-blue-200",
    };
  }

  return {
    label: "Reserved",
    chipClass: "border-white/10 bg-white/5 text-zinc-200",
  };
}

export function isBookingCancellable(booking) {
  const status = getBookingStatusMeta(booking).label.toLowerCase();
  return status !== "cancelled";
}

export function getStationCode(name, fallback = "---") {
  if (!name || typeof name !== "string") return fallback;

  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  return words[0].slice(0, 3).toUpperCase() || fallback;
}

export function getMilesTravelled(bookings = []) {
  const totalKm = bookings.reduce((sum, booking) => {
    const snapshot = getJourneySnapshot(booking);
    return sum + safeNumber(snapshot?.distanceKm, 0);
  }, 0);

  return Math.round(totalKm * 0.621371);
}

export function getActiveTickets(bookings = []) {
  return bookings.filter((booking) => {
    const status = getBookingStatusMeta(booking).label.toLowerCase();
    return status === "confirmed" || status === "processing" || status === "reserved";
  }).length;
}

export function getSeatLabel(booking) {
  const seats = safeNumber(booking?.seats, 0);
  if (seats > 0) return `${seats} ${seats === 1 ? "seat" : "seats"}`;
  return booking?.seatLabel || booking?.seatNumber || "Reserved";
}
