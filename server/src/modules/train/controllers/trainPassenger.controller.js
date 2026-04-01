import { TrainSchedule } from "../models/TrainSchedule.js";
import { Station } from "../models/Station.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Reuse population pattern so passenger APIs can read
 * station details from both base stops and weekly timetable rows.
 */
function applyPassengerPopulate(query) {
  return query
    .populate("stops.stationId", "name location active")
    .populate("weeklyTimetable.Mon.stationId", "name location active")
    .populate("weeklyTimetable.Tue.stationId", "name location active")
    .populate("weeklyTimetable.Wed.stationId", "name location active")
    .populate("weeklyTimetable.Thu.stationId", "name location active")
    .populate("weeklyTimetable.Fri.stationId", "name location active")
    .populate("weeklyTimetable.Sat.stationId", "name location active")
    .populate("weeklyTimetable.Sun.stationId", "name location active");
}

/**
 * Accept both possible location shapes:
 * 1) { lat, lng }
 * 2) GeoJSON { coordinates: [lng, lat] }
 */
function getLatLngFromStation(station) {
  if (!station) return null;

  if (
    typeof station?.location?.lat === "number" &&
    typeof station?.location?.lng === "number"
  ) {
    return {
      lat: station.location.lat,
      lng: station.location.lng,
    };
  }

  if (
    Array.isArray(station?.location?.coordinates) &&
    station.location.coordinates.length >= 2
  ) {
    return {
      lng: Number(station.location.coordinates[0]),
      lat: Number(station.location.coordinates[1]),
    };
  }

  return null;
}

/**
 * Haversine distance in KM
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Rough access time estimate.
 * For MVP, use ~25 km/h average approach speed.
 * Later frontend map can replace this with real road ETA.
 */
function estimateAccessMinutes(distanceKm) {
  if (!Number.isFinite(distanceKm)) return null;
  return Math.max(1, Math.round((distanceKm / 25) * 60));
}

function timeToMinutes(value) {
  if (!value || typeof value !== "string") return null;

  const [hh, mm] = value.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;

  return hh * 60 + mm;
}

function formatDuration(mins) {
  if (!Number.isFinite(mins) || mins < 0) return "";

  const h = Math.floor(mins / 60);
  const m = mins % 60;

  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function resolveRowsForDay(schedule, day) {
  if (day && DAYS.includes(day)) {
    const rows = schedule?.weeklyTimetable?.[day];
    if (Array.isArray(rows) && rows.length > 0) {
      return rows;
    }
  }

  return Array.isArray(schedule?.stops) ? schedule.stops : [];
}

function sortByOrder(rows) {
  return [...rows].sort((a, b) => Number(a.order) - Number(b.order));
}

function getRowStationId(row) {
  const id = row?.stationId?._id || row?.stationId;
  return id ? String(id) : "";
}

function getRowStationName(row) {
  return row?.stationId?.name || "";
}

function matchesStation(row, { stationId, stationName }) {
  const rowId = getRowStationId(row);
  const rowName = getRowStationName(row).trim().toLowerCase();

  if (stationId && rowId === String(stationId)) return true;
  if (stationName && rowName === stationName.trim().toLowerCase()) return true;

  return false;
}

function mapStop(row) {
  return {
    order: Number(row.order),
    arrivalTime: row.arrivalTime || "",
    departureTime: row.departureTime || "",
    station: row?.stationId
      ? {
          _id: row.stationId._id,
          name: row.stationId.name,
          location: row.stationId.location || null,
        }
      : null,
  };
}

function buildJourneyDuration(fromRow, toRow) {
  const departMins = timeToMinutes(fromRow?.departureTime);
  const arriveMins = timeToMinutes(toRow?.arrivalTime || toRow?.departureTime);

  if (
    Number.isFinite(departMins) &&
    Number.isFinite(arriveMins) &&
    arriveMins >= departMins
  ) {
    return arriveMins - departMins;
  }

  return null;
}

/**
 * Existing passenger search by explicit station names
 * GET /api/train/search?from=Colombo Fort&to=Kandy&day=Mon
 */
export async function searchTrains(req, res, next) {
  try {
    const { from, to, day } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "from and to are required" });
    }

    if (day && !DAYS.includes(day)) {
      return res
        .status(400)
        .json({ message: `day must be one of: ${DAYS.join(", ")}` });
    }

    const schedules = await applyPassengerPopulate(
      TrainSchedule.find({ active: true }).sort({ createdAt: -1 })
    ).lean();

    const results = [];

    for (const schedule of schedules) {
      const rows = sortByOrder(resolveRowsForDay(schedule, day));

      const fromIndex = rows.findIndex((r) =>
        matchesStation(r, { stationName: from })
      );
      const toIndex = rows.findIndex((r) =>
        matchesStation(r, { stationName: to })
      );

      if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) continue;

      const fromRow = rows[fromIndex];
      const toRow = rows[toIndex];

      const durationMinutes = buildJourneyDuration(fromRow, toRow);

      results.push({
        _id: schedule._id,
        trainNo: schedule.trainNo,
        trainName: schedule.trainName || "",
        seatCapacity: schedule.seatCapacity,
        totalDistanceKm: schedule.totalDistanceKm || 0,
        active: !!schedule.active,
        searchDay: day || null,
        from: {
          station: {
            _id: fromRow.stationId?._id,
            name: fromRow.stationId?.name || "",
            location: fromRow.stationId?.location || null,
          },
          departureTime: fromRow.departureTime || "",
        },
        to: {
          station: {
            _id: toRow.stationId?._id,
            name: toRow.stationId?.name || "",
            location: toRow.stationId?.location || null,
          },
          arrivalTime: toRow.arrivalTime || toRow.departureTime || "",
        },
        durationMinutes,
        durationLabel: formatDuration(durationMinutes),
        stopsBetween: rows.slice(fromIndex, toIndex + 1).map(mapStop),
      });
    }

    results.sort((a, b) => {
      const aTime = timeToMinutes(a.from?.departureTime);
      const bTime = timeToMinutes(b.from?.departureTime);

      if (Number.isFinite(aTime) && Number.isFinite(bTime)) return aTime - bTime;
      if (Number.isFinite(aTime)) return -1;
      if (Number.isFinite(bTime)) return 1;
      return 0;
    });

    return res.json({
      filters: { from, to, day: day || null },
      count: results.length,
      trains: results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Passenger details
 * GET /api/train/schedules/:id?day=Mon
 */
export async function getPassengerTrainDetails(req, res, next) {
  try {
    const { day } = req.query;

    if (day && !DAYS.includes(day)) {
      return res
        .status(400)
        .json({ message: `day must be one of: ${DAYS.join(", ")}` });
    }

    const schedule = await applyPassengerPopulate(
      TrainSchedule.findOne({
        _id: req.params.id,
        active: true,
      })
    ).lean();

    if (!schedule) {
      return res.status(404).json({ message: "Train schedule not found" });
    }

    const rows = sortByOrder(resolveRowsForDay(schedule, day));

    return res.json({
      schedule: {
        _id: schedule._id,
        trainNo: schedule.trainNo,
        trainName: schedule.trainName || "",
        seatCapacity: schedule.seatCapacity,
        totalDistanceKm: schedule.totalDistanceKm || 0,
        active: !!schedule.active,
        selectedDay: day || null,
        stops: rows.map(mapStop),
        segments: Array.isArray(schedule.segments) ? schedule.segments : [],
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * NEW
 * Get nearest active stations from a passenger location.
 * GET /api/train/nearest-stations?lat=6.9&lng=79.8&limit=5
 */
export async function listNearestStations(req, res, next) {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const limit = Math.max(1, Number(req.query.limit || 5));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: "lat and lng are required numbers" });
    }

    const stations = await Station.find({ active: true }).lean();

    const nearest = stations
      .map((station) => {
        const point = getLatLngFromStation(station);
        if (!point) return null;

        const distanceKm = haversineKm(lat, lng, point.lat, point.lng);

        return {
          _id: station._id,
          name: station.name,
          location: station.location || null,
          distanceKm: Number(distanceKm.toFixed(2)),
          accessEstimateMinutes: estimateAccessMinutes(distanceKm),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    return res.json({
      origin: { lat, lng },
      count: nearest.length,
      stations: nearest,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * NEW
 * Search trains from passenger location to destination station.
 *
 * GET /api/train/search-nearby?lat=6.9&lng=79.8&to=Kandy&day=Mon
 * OR
 * GET /api/train/search-nearby?lat=6.9&lng=79.8&toStationId=...&day=Mon
 */
export async function searchNearbyTrains(req, res, next) {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const { to, toStationId, day } = req.query;

    const candidateLimit = Math.max(1, Number(req.query.candidateLimit || 5));
    const maxDistanceKm = req.query.maxDistanceKm
      ? Number(req.query.maxDistanceKm)
      : null;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: "lat and lng are required numbers" });
    }

    if (!to && !toStationId) {
      return res
        .status(400)
        .json({ message: "to or toStationId is required" });
    }

    if (day && !DAYS.includes(day)) {
      return res
        .status(400)
        .json({ message: `day must be one of: ${DAYS.join(", ")}` });
    }

    const stations = await Station.find({ active: true }).lean();

    const nearbyStations = stations
      .map((station) => {
        const point = getLatLngFromStation(station);
        if (!point) return null;

        const distanceKm = haversineKm(lat, lng, point.lat, point.lng);

        return {
          _id: String(station._id),
          name: station.name,
          location: station.location || null,
          distanceKm,
          accessEstimateMinutes: estimateAccessMinutes(distanceKm),
        };
      })
      .filter(Boolean)
      .filter((station) => {
        if (!Number.isFinite(maxDistanceKm)) return true;
        return station.distanceKm <= maxDistanceKm;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, candidateLimit);

    const schedules = await applyPassengerPopulate(
      TrainSchedule.find({ active: true }).sort({ createdAt: -1 })
    ).lean();

    const trains = [];

    for (const schedule of schedules) {
      const rows = sortByOrder(resolveRowsForDay(schedule, day));

      const destinationIndex = rows.findIndex((row) =>
        matchesStation(row, {
          stationId: toStationId,
          stationName: to,
        })
      );

      if (destinationIndex === -1) continue;

      const destinationRow = rows[destinationIndex];

      // Find the nearest station to the user that this train actually serves
      // before the destination.
      let chosenCandidate = null;
      let chosenBoardingIndex = -1;

      for (const candidate of nearbyStations) {
        const boardingIndex = rows.findIndex((row) =>
          matchesStation(row, { stationId: candidate._id })
        );

        if (boardingIndex !== -1 && boardingIndex < destinationIndex) {
          chosenCandidate = candidate;
          chosenBoardingIndex = boardingIndex;
          break;
        }
      }

      if (!chosenCandidate || chosenBoardingIndex === -1) continue;

      const boardingRow = rows[chosenBoardingIndex];
      const durationMinutes = buildJourneyDuration(boardingRow, destinationRow);

      trains.push({
        _id: schedule._id,
        trainNo: schedule.trainNo,
        trainName: schedule.trainName || "",
        seatCapacity: schedule.seatCapacity,
        totalDistanceKm: schedule.totalDistanceKm || 0,
        active: !!schedule.active,
        searchDay: day || null,

        boardingStation: {
          _id: boardingRow.stationId?._id,
          name: boardingRow.stationId?.name || "",
          location: boardingRow.stationId?.location || null,
          distanceKm: Number(chosenCandidate.distanceKm.toFixed(2)),
          accessEstimateMinutes: chosenCandidate.accessEstimateMinutes,
          departureTime: boardingRow.departureTime || "",
        },

        destinationStation: {
          _id: destinationRow.stationId?._id,
          name: destinationRow.stationId?.name || "",
          location: destinationRow.stationId?.location || null,
          arrivalTime:
            destinationRow.arrivalTime || destinationRow.departureTime || "",
        },

        durationMinutes,
        durationLabel: formatDuration(durationMinutes),

        stopsBetween: rows
          .slice(chosenBoardingIndex, destinationIndex + 1)
          .map(mapStop),
      });
    }

    trains.sort((a, b) => {
      if (a.boardingStation.distanceKm !== b.boardingStation.distanceKm) {
        return a.boardingStation.distanceKm - b.boardingStation.distanceKm;
      }

      const aTime = timeToMinutes(a.boardingStation.departureTime);
      const bTime = timeToMinutes(b.boardingStation.departureTime);

      if (Number.isFinite(aTime) && Number.isFinite(bTime)) return aTime - bTime;
      if (Number.isFinite(aTime)) return -1;
      if (Number.isFinite(bTime)) return 1;
      return 0;
    });

    return res.json({
      origin: { lat, lng },
      filters: {
        to: to || null,
        toStationId: toStationId || null,
        day: day || null,
        candidateLimit,
        maxDistanceKm: Number.isFinite(maxDistanceKm) ? maxDistanceKm : null,
      },
      nearbyStations: nearbyStations.map((s) => ({
        ...s,
        distanceKm: Number(s.distanceKm.toFixed(2)),
      })),
      count: trains.length,
      trains,
    });
  } catch (error) {
    next(error);
  }
}