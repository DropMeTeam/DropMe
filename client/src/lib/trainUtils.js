export function calculateTrainTotal(ticketPrice, passengerCount) {
  return ticketPrice * passengerCount;
}

export function formatStationPair(from, to) {
  return `${from} → ${to}`;
}

export function formatDuration(hours, minutes) {
  return `${hours}h ${minutes}m`;
}