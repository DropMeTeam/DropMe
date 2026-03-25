import { TrainSchedule } from "../models/TrainSchedule.js";
import { HttpError } from "../../../utils/httpError.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Reuse the same population pattern as admin side,
 * but keep it local so passenger controller stays independent.
 */
function applyPassengerPopulate(q) {
  return q
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
 * Convert "09:30" -> minutes since midnight
 * Returns null for bad input so sorting/duration won't crash.
 */
function timeToMinutes(value) {
  if (!value || typeof value !== "string") return null;

  const [hh, mm] = value.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;

  return hh * 60 + mm;
}

/**
 * Convert minute diff to "2h 15m" style.
 */
function formatDuration(mins) {
  if (!Number.isFinite(mins) || mins < 0) return "";

  const h = Math.floor(mins / 60);
  const m = mins % 60;

  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Pick timetable rows for the selected day.
 * If the day has timetable rows, use them.
 * Otherwise fall back to base stops.
 */
function resolveRowsForDay(schedule, day) {
  if (day && DAYS.includes(day)) {
    const rows = schedule?.weeklyTimetable?.[day];
    if (Array.isArray(rows) && rows.length > 0) {
      return rows;
    }
  }

  return Array.isArray(schedule?.stops) ? schedule.stops : [];
}

/**
 * Ensure rows are in stop order.
 */
function sortByOrder(rows) {
  return [...rows].sort((a, b) => Number(a.order) - Number(b.order));
}

/**
 * Safe station name extractor.
 */
function stationName(row) {
  return row?.stationId?.name || "";
}

/**
 * Build a passenger-friendly stop object.
 */
function mapStop(row) {
  return {
    order: Number(row.order),
    arrivalTime: row.arrivalTime || "",
    departureTime: row.departureTime || "",
    station: row.stationId
      ? {
          _id: row.stationId._id,
          name: row.stationId.name,
          location: row.stationId.location || null,
        }
      : null,
  };
}

/**
 * Find matching origin/destination rows in correct travel order.
 */
function findJourneySlice(rows, fromName, toName) {
  const ordered = sortByOrder(rows);

  const fromIndex = ordered.findIndex(
    (r) => stationName(r).trim().toLowerCase() === fromName.trim().toLowerCase()
  );

  const toIndex = ordered.findIndex(
    (r) => stationName(r).trim().toLowerCase() === toName.trim().toLowerCase()
  );

  if (fromIndex === -1 || toIndex === -1) return null;
  if (fromIndex >= toIndex) return null;

  const fromRow = ordered[fromIndex];
  const toRow = ordered[toIndex];
  const departMins = timeToMinutes(fromRow.departureTime);
  const arriveMins = timeToMinutes(toRow.arrivalTime || toRow.departureTime);

  let durationMinutes = null;
  if (Number.isFinite(departMins) && Number.isFinite(arriveMins) && arriveMins >= departMins) {
    durationMinutes = arriveMins - departMins;
  }

  return {
    fromRow,
    toRow,
    fromIndex,
    toIndex,
    ordered,
    durationMinutes,
  };
}

/**
 * GET /api/train/search?from=Colombo Fort&to=Kandy&day=Mon
 *
 * Notes:
 * - from and to are station names for MVP
 * - day is optional: Mon/Tue/Wed/Thu/Fri/Sat/Sun
 * - uses weeklyTimetable for the selected day if available
 * - falls back to base stops if no day timetable exists
 */
export async function searchTrains(req, res, next) {
  try {
    const { from, to, day } = req.query;

    if (!from || !to) {
      throw new HttpError(400, "from and to are required");
    }

    if (day && !DAYS.includes(day)) {
      throw new HttpError(400, `day must be one of: ${DAYS.join(", ")}`);
    }

    const q = TrainSchedule.find({ active: true }).sort({ createdAt: -1 });
    const schedules = await applyPassengerPopulate(q).lean();

    const results = [];

    for (const schedule of schedules) {
      const rows = resolveRowsForDay(schedule, day);
      const match = findJourneySlice(rows, from, to);

      if (!match) continue;

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
            _id: match.fromRow.stationId?._id,
            name: match.fromRow.stationId?.name || "",
            location: match.fromRow.stationId?.location || null,
          },
          departureTime: match.fromRow.departureTime || "",
        },

        to: {
          station: {
            _id: match.toRow.stationId?._id,
            name: match.toRow.stationId?.name || "",
            location: match.toRow.stationId?.location || null,
          },
          arrivalTime: match.toRow.arrivalTime || match.toRow.departureTime || "",
        },

        durationMinutes: match.durationMinutes,
        durationLabel: formatDuration(match.durationMinutes),

        stopsBetween: match.ordered
          .slice(match.fromIndex, match.toIndex + 1)
          .map(mapStop),
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

    res.json({
      filters: {
        from,
        to,
        day: day || null,
      },
      count: results.length,
      trains: results,
    });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/train/schedules/:id?day=Mon
 *
 * Returns a passenger-friendly schedule.
 */
export async function getPassengerTrainDetails(req, res, next) {
  try {
    const { day } = req.query;

    if (day && !DAYS.includes(day)) {
      throw new HttpError(400, `day must be one of: ${DAYS.join(", ")}`);
    }

    const q = TrainSchedule.findOne({
      _id: req.params.id,
      active: true,
    });

    const schedule = await applyPassengerPopulate(q).lean();

    if (!schedule) {
      throw new HttpError(404, "Train schedule not found");
    }

    const rows = resolveRowsForDay(schedule, day);
    const orderedRows = sortByOrder(rows);

    res.json({
      schedule: {
        _id: schedule._id,
        trainNo: schedule.trainNo,
        trainName: schedule.trainName || "",
        seatCapacity: schedule.seatCapacity,
        totalDistanceKm: schedule.totalDistanceKm || 0,
        active: !!schedule.active,
        selectedDay: day || null,
        stops: orderedRows.map(mapStop),
        segments: Array.isArray(schedule.segments) ? schedule.segments : [],
      },
    });
  } catch (e) {
    next(e);
  }
}