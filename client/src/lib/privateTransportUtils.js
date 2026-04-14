export function calculatePrivateFare(baseFare, perKmRate, distanceKm) {
  return baseFare + perKmRate * distanceKm;
}

export function hasAvailableSeats(totalSeats, bookedSeats) {
  return bookedSeats < totalSeats;
}

export function getRideStatusLabel(status) {
  const map = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return map[status] || "Unknown";
}