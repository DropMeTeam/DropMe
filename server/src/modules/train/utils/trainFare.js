import { HttpError } from "../../../utils/httpError.js";

/**
 * Calculate the total fare for a journey between two stations in a train schedule.
 *
 * @param {Object} schedule - The TrainSchedule document or plain object.
 * @param {String} boardingStationId - ID of the boarding station.
 * @param {String} destinationStationId - ID of the destination station.
 * @param {String} day - Optional day of the week (Mon-Sun).
 * @returns {Object} - { farePerSeatLkr, segmentCount }
 */
export function calculateJourneyFare(schedule, boardingStationId, destinationStationId, day) {
  if (!schedule || !schedule.stops || !schedule.segments) {
    throw new HttpError(400, "Invalid schedule data");
  }

  // Determine which stop list to use: weeklyTimetable or the main stops array
  let stopList = schedule.stops;
  if (day && schedule.weeklyTimetable && schedule.weeklyTimetable[day] && schedule.weeklyTimetable[day].length > 0) {
    stopList = schedule.weeklyTimetable[day];
  }

  // Find indexes of boarding and destination stations
  const boardingIndex = stopList.findIndex(
    (s) => String(s.stationId._id || s.stationId) === String(boardingStationId)
  );
  const destinationIndex = stopList.findIndex(
    (s) => String(s.stationId._id || s.stationId) === String(destinationStationId)
  );

  if (boardingIndex === -1) {
    throw new HttpError(400, "Boarding station not found in schedule");
  }
  if (destinationIndex === -1) {
    throw new HttpError(400, "Destination station not found in schedule");
  }
  if (boardingIndex >= destinationIndex) {
    throw new HttpError(400, "Destination must be after boarding station");
  }

  // Get the ordered sequence of station IDs from boarding to destination
  const journeyStationIds = stopList
    .slice(boardingIndex, destinationIndex + 1)
    .map((s) => String(s.stationId._id || s.stationId));

  let totalFare = 0;
  let segmentCount = 0;

  // Sum up fares for each adjacent pair in the journey
  for (let i = 0; i < journeyStationIds.length - 1; i++) {
    const fromId = journeyStationIds[i];
    const toId = journeyStationIds[i + 1];

    // Find the matching segment in schedule.segments
    const segment = schedule.segments.find(
      (seg) =>
        String(seg.fromStationId?._id || seg.fromStationId) === fromId &&
        String(seg.toStationId?._id || seg.toStationId) === toId
    );

    if (!segment) {
      // Log missing segment for debugging but don't crash the entire search
      console.warn(`Fare segment not found for ${fromId} to ${toId} in schedule ${schedule._id}`);
      continue;
    }

    totalFare += segment.fareLkr || 0;
    segmentCount++;
  }

  return {
    farePerSeatLkr: totalFare,
    segmentCount,
  };
}
