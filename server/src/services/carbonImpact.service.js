// server/src/services/carbonImpact.service.js
import mongoose from "mongoose";
import CarbonImpact from "../models/CarbonImpact.js";
import { RideBooking } from "../models/RideBooking.js";
import { BusBooking } from "../modules/bus/models/BusBooking.js";
import { TrainBooking } from "../modules/train/models/TrainBooking.js";
import { estimatePassengerOverDistance } from "./climatiq.service.js";

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

function calculatePoints(savedKg) {
  const raw = Math.round((Number(savedKg) || 0) * 10);
  if (raw <= 0) return 0;
  return Math.max(5, Math.min(250, raw));
}

//function buildOccurredAt(dateStr, timeStr = "00:00") {
//  if (!dateStr) return new Date();
//
//  const safeTime = /^\d{2}:\d{2}$/.test(String(timeStr || "")) ? timeStr : "00:00";
//  const iso = `${dateStr}T${safeTime}:00:00.000Z`;
//  const parsed = new Date(iso);
//
//  if (Number.isNaN(parsed.getTime())) {
//    return new Date(`${dateStr}T00:00:00.000Z`);
//  }
//
//  return parsed;
//}

function buildOccurredAt(dateStr, timeStr = "00:00") {
  if (!dateStr) return new Date();

  const safeTime = /^\d{2}:\d{2}$/.test(String(timeStr || "")) ? timeStr : "00:00";
  const iso = `${dateStr}T${safeTime}:00.000Z`;
  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return new Date(`${dateStr}T00:00:00.000Z`);
  }

  return parsed;
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function toObjectId(value) {
  if (!isValidObjectId(value)) return null;
  return new mongoose.Types.ObjectId(value);
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
    name: booking?.riderSnapshot?.name || booking?.riderId?.name || "",
    email: booking?.riderSnapshot?.email || booking?.riderId?.email || "",
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

function isEligibleBusBooking(booking) {
  return Boolean(
    booking &&
      booking.bookingStatus === "booked" &&
      booking.paymentStatus === "paid"
  );
}

function isEligibleTrainBooking(booking) {
  return Boolean(
    booking &&
      booking.bookingStatus === "booked" &&
      booking.paymentStatus === "paid" &&
      booking.ticketUsageStatus === "used"
  );
}

function isEligibleRideBooking(booking) {
  return Boolean(
    booking &&
      booking.status === "confirmed" &&
      booking.paymentStatus === "paid" &&
      booking.rideCompleted === true
  );
}

export async function createCarbonImpactForBusBooking(booking) {
  if (!isEligibleBusBooking(booking)) return null;

  const userId = toObjectId(booking?.passengerId);
  if (!userId) return null;

  const distanceKm = Number(booking?.journeySnapshot?.passengerDistanceKm || 0);
  const passengerCount = Array.isArray(booking?.seatNumbers)
    ? Math.max(1, booking.seatNumbers.length)
    : 1;

  if (distanceKm <= 0) return null;

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
  const avoidedFuelLiters = round(savedKg / KG_CO2_PER_LITER, 3);

  return upsertImpact(
    {
      sourceType: "bus_booking",
      sourceId: booking._id,
    },
    {
      userId,
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

export async function createCarbonImpactForTrainBooking(booking) {
  if (!isEligibleTrainBooking(booking)) return null;

  const userId = toObjectId(booking?.passengerId);
  if (!userId) return null;

  const distanceKm = Number(booking?.journeySnapshot?.distanceKm || 0);
  const passengerCount = Math.max(1, Number(booking?.seats || 1));

  if (distanceKm <= 0) return null;

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
  const avoidedFuelLiters = round(savedKg / KG_CO2_PER_LITER, 3);

  return upsertImpact(
    {
      sourceType: "train_booking",
      sourceId: booking._id,
    },
    {
      userId,
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
      occurredAt:
        booking.ticketUsedAt ||
        buildOccurredAt(
          booking.travelDate,
          booking?.journeySnapshot?.departureTime || "00:00"
        ),
      meta: {
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
        ticketUsageStatus: booking.ticketUsageStatus,
        ticketUsedAt: booking.ticketUsedAt || null,
        travelDate: booking.travelDate,
        trainNo: booking?.journeySnapshot?.trainNo || "",
        trainName: booking?.journeySnapshot?.trainName || "",
      },
    }
  );
}

export async function createCarbonImpactForRideBooking(booking) {
  if (!isEligibleRideBooking(booking)) return null;

  const userId = toObjectId(booking?.riderId);
  if (!userId) return null;

  const distanceKm = Number(
    booking?.routeDistanceKm || booking?.offerSnapshot?.routeDistanceKm || 0
  );

  const riderSeats = Math.max(1, Number(booking?.seatsBooked || 1));
  const occupancyApplied = Math.max(
    2,
    Number(booking?.actualOccupancy || riderSeats + 1)
  );

  if (distanceKm <= 0) return null;

  const baseline = await estimatePassengerOverDistance({
    activityId: BASELINE_PRIVATE_ID,
    distanceKm,
    passengers: riderSeats,
  });

  const actualBase = await estimatePassengerOverDistance({
    activityId: CARPOOL_ID,
    distanceKm,
    passengers: riderSeats,
  });

  const actualSharedKg = actualBase.co2eKg / occupancyApplied;

  const savedKg = clampPositive(baseline.co2eKg - actualSharedKg);
  const points = calculatePoints(savedKg);
  const avoidedFuelLiters = round(savedKg / KG_CO2_PER_LITER, 3);

  return upsertImpact(
    {
      sourceType: "ride_booking",
      sourceId: booking._id,
    },
    {
      userId,
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

export async function syncCarbonImpactForBusBookingId(bookingId) {
  if (!isValidObjectId(bookingId)) return null;
  const booking = await BusBooking.findById(bookingId).lean();
  if (!booking) return null;
  return createCarbonImpactForBusBooking(booking);
}

export async function syncCarbonImpactForTrainBookingId(bookingId) {
  if (!isValidObjectId(bookingId)) return null;
  const booking = await TrainBooking.findById(bookingId).lean();
  if (!booking) return null;
  return createCarbonImpactForTrainBooking(booking);
}

export async function syncCarbonImpactForRideBookingId(bookingId) {
  if (!isValidObjectId(bookingId)) return null;
  const booking = await RideBooking.findById(bookingId).lean();
  if (!booking) return null;
  return createCarbonImpactForRideBooking(booking);
}

export async function syncCarbonImpactsForUser(userId) {
  const objectUserId = toObjectId(userId);
  if (!objectUserId) {
    return { bus: 0, train: 0, ride: 0, total: 0 };
  }

  const stringUserId = String(objectUserId);

  const [busBookings, trainBookings, rideBookings] = await Promise.all([
    BusBooking.find({
      passengerId: stringUserId,
      bookingStatus: "booked",
      paymentStatus: "paid",
    }).lean(),

    TrainBooking.find({
      passengerId: stringUserId,
      bookingStatus: "booked",
      paymentStatus: "paid",
      ticketUsageStatus: "used",
    }).lean(),

    RideBooking.find({
      riderId: objectUserId,
      status: "confirmed",
      paymentStatus: "paid",
      rideCompleted: true,
    }).lean(),
  ]);

  const [busResults, trainResults, rideResults] = await Promise.all([
    Promise.all(busBookings.map((booking) => createCarbonImpactForBusBooking(booking))),
    Promise.all(trainBookings.map((booking) => createCarbonImpactForTrainBooking(booking))),
    Promise.all(rideBookings.map((booking) => createCarbonImpactForRideBooking(booking))),
  ]);

  const busCount = busResults.filter(Boolean).length;
  const trainCount = trainResults.filter(Boolean).length;
  const rideCount = rideResults.filter(Boolean).length;

  return {
    bus: busCount,
    train: trainCount,
    ride: rideCount,
    total: busCount + trainCount + rideCount,
  };
}

