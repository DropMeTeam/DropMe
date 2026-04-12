import CarbonImpact from "../models/CarbonImpact.js";
import { estimatePassengerOverDistance } from "./climatiq.service.js";

// ENV-based activity IDs so you can change them later without touching code.
const BASELINE_PRIVATE_ID =
  process.env.CLIMATIQ_EF_BASELINE_PRIVATE_PKM ||
  "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na";

const BUS_ID =
  process.env.CLIMATIQ_EF_BUS_PKM ||
  "passenger_vehicle-vehicle_type_bus-fuel_source_na-distance_na-engine_size_na";

const TRAIN_ID =
  process.env.CLIMATIQ_EF_TRAIN_PKM ||
  "passenger_train-route_type_national_rail-fuel_source_na";

const CARPOOL_ID =
  process.env.CLIMATIQ_EF_CARPOOL_PKM || BASELINE_PRIVATE_ID;

const KG_CO2_PER_LITER =
  Number(process.env.PRIVATE_CAR_CO2_KG_PER_LITER) || 2.35;

function round(value, places = 3) {
  const factor = 10 ** places;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function clampPositive(value) {
  return Math.max(0, Number(value) || 0);
}

// Your gamification rule.
// Example: 11.028 kg => 110 points approximately.
function calculatePoints(savedKg) {
  const raw = Math.round((Number(savedKg) || 0) * 10);

  if (raw <= 0) return 0;

  // Minimum motivation + safety cap.
  return Math.max(5, Math.min(250, raw));
}

function buildOccurredAt(dateStr, timeStr = "00:00") {
  if (!dateStr) return new Date();

  // Keep it simple: convert to an ISO string.
  const iso = `${dateStr}T${timeStr}:00.000Z`;
  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return new Date(`${dateStr}T00:00:00.000Z`);
  }

  return parsed;
}

function getBusUserSnapshot(booking) {
  return {
    name: booking?.passengerSnapshot?.name || "",
    email: booking?.passengerSnapshot?.email || "",
  };
}

function getTrainUserSnapshot(booking) {
  return {
    name: booking?.passengerSnapshot?.name || "",
    email: booking?.passengerSnapshot?.email || "",
  };
}

function getRideUserSnapshot(booking) {
  return {
    name:
      booking?.riderSnapshot?.name ||
      booking?.riderId?.name ||
      "",
    email:
      booking?.riderSnapshot?.email ||
      booking?.riderId?.email ||
      "",
  };
}

async function upsertImpact(filter, doc) {
  return CarbonImpact.findOneAndUpdate(
    filter,
    { $set: doc },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
}

/**
 * BUS:
 * Trigger this exactly after bus booking payment becomes paid.
 */
export async function createCarbonImpactForBusBooking(booking) {
  if (!booking || booking.paymentStatus !== "paid") {
    return null;
  }

  const distanceKm = Number(booking?.journeySnapshot?.passengerDistanceKm || 0);
  const passengerCount = Array.isArray(booking?.seatNumbers)
    ? Math.max(1, booking.seatNumbers.length)
    : 1;

  if (distanceKm <= 0) {
    return null;
  }

  const baseline = await estimatePassengerOverDistance({
    activityId: BASELINE_PRIVATE_ID,
    distanceKm,
    passengers: passengerCount,
  });

  const actual = await estimatePassengerOverDistance({
    activityId: BUS_ID,
    distanceKm,
    passengers: passengerCount,
  });

  const savedKg = clampPositive(baseline.co2eKg - actual.co2eKg);
  const points = calculatePoints(savedKg);
  const avoidedFuelLiters = round(baseline.co2eKg / KG_CO2_PER_LITER, 3);

  return upsertImpact(
    {
      sourceType: "bus_booking",
      sourceId: booking._id,
    },
    {
      userId: booking.passengerId,
      userSnapshot: getBusUserSnapshot(booking),

      sourceType: "bus_booking",
      sourceId: booking._id,
      mode: "bus",

      distanceKm: round(distanceKm, 3),
      passengerCount,

      baseline: {
        activityId: BASELINE_PRIVATE_ID,
        co2eKg: round(baseline.co2eKg, 3),
        occupancyApplied: null,
      },

      actual: {
        activityId: BUS_ID,
        co2eKg: round(actual.co2eKg, 3),
        occupancyApplied: null,
      },

      savedKg: round(savedKg, 3),
      avoidedFuelLiters,
      points,
      factorVersion: process.env.CLIMATIQ_DATA_VERSION || "32",

      occurredAt: buildOccurredAt(
        booking.travelDate,
        booking?.pickupStop?.time || "00:00"
      ),

      meta: {
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
        travelDate: booking.travelDate,
        routeNumber: booking?.journeySnapshot?.routeNumber || "",
        busNumber: booking?.journeySnapshot?.busNumber || "",
      },
    }
  );
}

/**
 * TRAIN:
 * Trigger this exactly after train booking payment becomes paid.
 */
export async function createCarbonImpactForTrainBooking(booking) {
  if (!booking || booking.paymentStatus !== "paid") {
    return null;
  }

  const distanceKm = Number(booking?.journeySnapshot?.distanceKm || 0);
  const passengerCount = Math.max(1, Number(booking?.seats || 1));

  if (distanceKm <= 0) {
    return null;
  }

  const baseline = await estimatePassengerOverDistance({
    activityId: BASELINE_PRIVATE_ID,
    distanceKm,
    passengers: passengerCount,
  });

  const actual = await estimatePassengerOverDistance({
    activityId: TRAIN_ID,
    distanceKm,
    passengers: passengerCount,
  });

  const savedKg = clampPositive(baseline.co2eKg - actual.co2eKg);
  const points = calculatePoints(savedKg);
  const avoidedFuelLiters = round(baseline.co2eKg / KG_CO2_PER_LITER, 3);

  return upsertImpact(
    {
      sourceType: "train_booking",
      sourceId: booking._id,
    },
    {
      userId: booking.passengerId,
      userSnapshot: getTrainUserSnapshot(booking),

      sourceType: "train_booking",
      sourceId: booking._id,
      mode: "train",

      distanceKm: round(distanceKm, 3),
      passengerCount,

      baseline: {
        activityId: BASELINE_PRIVATE_ID,
        co2eKg: round(baseline.co2eKg, 3),
        occupancyApplied: null,
      },

      actual: {
        activityId: TRAIN_ID,
        co2eKg: round(actual.co2eKg, 3),
        occupancyApplied: null,
      },

      savedKg: round(savedKg, 3),
      avoidedFuelLiters,
      points,
      factorVersion: process.env.CLIMATIQ_DATA_VERSION || "32",

      occurredAt: buildOccurredAt(
        booking.travelDate,
        booking?.journeySnapshot?.departureTime || "00:00"
      ),

      meta: {
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
        ticketUsageStatus: booking.ticketUsageStatus,
        travelDate: booking.travelDate,
        trainNo: booking?.journeySnapshot?.trainNo || "",
        trainName: booking?.journeySnapshot?.trainName || "",
      },
    }
  );
}

/**
 * RIDE / CARPOOL:
 * Trigger this exactly when rideCompleted becomes true.
 *
 * Logic:
 * - baseline = how much those rider seats would emit if each rider used a solo car
 * - actual = same car emission, but shared across actual vehicle occupancy
 */
export async function createCarbonImpactForRideBooking(booking) {
  if (!booking || booking.paymentStatus !== "paid" || booking.rideCompleted !== true) {
    return null;
  }

  const distanceKm = Number(
    booking?.routeDistanceKm || booking?.offerSnapshot?.routeDistanceKm || 0
  );

  const riderSeats = Math.max(1, Number(booking?.seatsBooked || 1));

  // Minimum occupancy is 2 => driver + at least one rider.
  // You can later replace this with your true actual occupancy if you store it.
  const occupancyApplied = Math.max(
    2,
    Number(booking?.actualOccupancy || riderSeats + 1)
  );

  if (distanceKm <= 0) {
    return null;
  }

  // Baseline: each rider would otherwise have used a private car alone.
  const baseline = await estimatePassengerOverDistance({
    activityId: BASELINE_PRIVATE_ID,
    distanceKm,
    passengers: riderSeats,
  });

  // Actual shared-car emissions before occupancy split.
  const actualBase = await estimatePassengerOverDistance({
    activityId: CARPOOL_ID,
    distanceKm,
    passengers: riderSeats,
  });

  // Shared allocation rule.
  const actualSharedKg = actualBase.co2eKg / occupancyApplied;

  const savedKg = clampPositive(baseline.co2eKg - actualSharedKg);
  const points = calculatePoints(savedKg);
  const avoidedFuelLiters = round(baseline.co2eKg / KG_CO2_PER_LITER, 3);

  return upsertImpact(
    {
      sourceType: "ride_booking",
      sourceId: booking._id,
    },
    {
      userId: booking.riderId,
      userSnapshot: getRideUserSnapshot(booking),

      sourceType: "ride_booking",
      sourceId: booking._id,
      mode: "carpool",

      distanceKm: round(distanceKm, 3),
      passengerCount: riderSeats,

      baseline: {
        activityId: BASELINE_PRIVATE_ID,
        co2eKg: round(baseline.co2eKg, 3),
        occupancyApplied: null,
      },

      actual: {
        activityId: CARPOOL_ID,
        co2eKg: round(actualSharedKg, 3),
        occupancyApplied,
      },

      savedKg: round(savedKg, 3),
      avoidedFuelLiters,
      points,
      factorVersion: process.env.CLIMATIQ_DATA_VERSION || "32",

      occurredAt: booking.rideCompletedAt || booking.paidAt || new Date(),

      meta: {
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        rideCompleted: booking.rideCompleted,
        rideCompletedAt: booking.rideCompletedAt,
        routeDistanceText: booking.routeDistanceText || "",
        driverName: booking?.offerSnapshot?.driverName || "",
        vehicleType: booking?.offerSnapshot?.vehicleType || "",
      },
    }
  );
}