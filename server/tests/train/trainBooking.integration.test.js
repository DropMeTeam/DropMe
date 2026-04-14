import express from "express";
import request from "supertest";
import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import {
  createTrainBookingCheckout,
  listMyTrainBookings,
  cancelMyTrainBooking,
} from "../../src/modules/train/controllers/trainBooking.controller.js";

import { Station } from "../../src/modules/train/models/Station.js";
import { TrainSchedule } from "../../src/modules/train/models/TrainSchedule.js";
import { TrainBooking } from "../../src/modules/train/models/TrainBooking.js";
import { TrainInventory } from "../../src/modules/train/models/TrainInventory.js";

let mongo;

export async function connectTestDb() {
  mongo = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  await mongoose.connect(mongo.getUri());
}

export async function closeTestDb() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongo) {
    await mongo.stop();
  }
}

function fakeRequireAuth(req, res, next) {
  req.user = {
    sub: "rider-123",
    name: "Test Rider",
    email: "rider@test.com",
    role: "rider",
  };
  next();
}

function fakeRequireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

function errorHandler(err, req, res, next) {
  res.status(err.statusCode || err.status || 500).json({
    message: err.message || "Server error",
  });
}

function buildApp() {
  const app = express();
  app.use(express.json());

  app.post(
    "/api/train/bookings/checkout",
    fakeRequireAuth,
    fakeRequireRole("rider"),
    createTrainBookingCheckout
  );

  app.get(
    "/api/train/bookings/mine",
    fakeRequireAuth,
    fakeRequireRole("rider"),
    listMyTrainBookings
  );

  app.patch(
    "/api/train/bookings/:id/cancel",
    fakeRequireAuth,
    fakeRequireRole("rider"),
    cancelMyTrainBooking
  );

  app.use(errorHandler);
  return app;
}

describe("Train booking integration", () => {
  let app;
  let stationA;
  let stationB;
  let schedule;

  beforeAll(async () => {
  mongo = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  await mongoose.connect(mongo.getUri());
  app = buildApp();
}, 60000);

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
  });

  beforeEach(async () => {
    await Station.deleteMany({});
    await TrainSchedule.deleteMany({});
    await TrainBooking.deleteMany({});
    await TrainInventory.deleteMany({});

    stationA = await Station.create({
      name: "Colombo Fort",
      address: "Colombo",
      location: { lat: 6.9344, lng: 79.8428 },
      isActive: true,
    });

    stationB = await Station.create({
      name: "Kandy",
      address: "Kandy",
      location: { lat: 7.2906, lng: 80.6337 },
      isActive: true,
    });

    schedule = await TrainSchedule.create({
      trainName: "Intercity Express",
      trainNo: "ICE-101",
      seatCapacity: 100,
      active: true,
      stops: [
        {
          stationId: stationA._id,
          departureTime: "08:00",
          arrivalTime: "08:00",
          order: 1,
        },
        {
          stationId: stationB._id,
          departureTime: "10:30",
          arrivalTime: "10:30",
          order: 2,
        },
      ],
      segments: [
        {
          fromStationId: stationA._id,
          toStationId: stationB._id,
          distanceKm: 120,
          fareLkr: 250,
          railPath: [],
        },
      ],
      totalDistanceKm: 120,
    });
  });

  it("creates a train booking checkout successfully", async () => {
    const res = await request(app).post("/api/train/bookings/checkout").send({
      scheduleId: String(schedule._id),
      boardingStationId: String(stationA._id),
      boardingStationName: "Colombo Fort",
      destinationStationId: String(stationB._id),
      destinationStationName: "Kandy",
      travelDate: "2026-04-20",
      seats: 1,
      journeySnapshot: {
        trainNo: "ICE-101",
        trainName: "Intercity Express",
        departureTime: "08:00",
        arrivalTime: "10:30",
        durationLabel: "2h 30m",
      },
    });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.booking.bookingStatus).toBe("pending_payment");
    expect(res.body.booking.paymentStatus).toBe("pending");
  });

  it("returns validation error when scheduleId is missing", async () => {
    const res = await request(app).post("/api/train/bookings/checkout").send({
      boardingStationId: String(stationA._id),
      boardingStationName: "Colombo Fort",
      destinationStationId: String(stationB._id),
      destinationStationName: "Kandy",
      travelDate: "2026-04-20",
      seats: 1,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/scheduleId is required/i);
  });

  it("lists my train bookings", async () => {
    await TrainBooking.create({
      scheduleId: schedule._id,
      passengerId: "rider-123",
      passengerSnapshot: {
        name: "Test Rider",
        email: "rider@test.com",
        role: "rider",
      },
      boardingStationId: stationA._id,
      boardingStationName: "Colombo Fort",
      destinationStationId: stationB._id,
      destinationStationName: "Kandy",
      travelDate: "2026-04-20",
      travelDay: "Mon",
      seats: 1,
      totalFareLkr: 250,
      bookingStatus: "pending_payment",
      paymentStatus: "pending",
      journeySnapshot: {
        trainNo: "ICE-101",
        trainName: "Intercity Express",
      },
    });

    const res = await request(app).get("/api/train/bookings/mine");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.bookings).toHaveLength(1);
  });

  it("cancels an unpaid booking", async () => {
    const booking = await TrainBooking.create({
      scheduleId: schedule._id,
      passengerId: "rider-123",
      passengerSnapshot: {
        name: "Test Rider",
        email: "rider@test.com",
        role: "rider",
      },
      boardingStationId: stationA._id,
      boardingStationName: "Colombo Fort",
      destinationStationId: stationB._id,
      destinationStationName: "Kandy",
      travelDate: "2026-04-20",
      travelDay: "Mon",
      seats: 1,
      totalFareLkr: 250,
      bookingStatus: "pending_payment",
      paymentStatus: "pending",
      journeySnapshot: {
        trainNo: "ICE-101",
        trainName: "Intercity Express",
      },
    });

    const res = await request(app).patch(`/api/train/bookings/${booking._id}/cancel`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.booking.bookingStatus).toBe("cancelled");
    expect(res.body.booking.paymentStatus).toBe("cancelled");
  });

  it("does not cancel a paid booking", async () => {
    const booking = await TrainBooking.create({
      scheduleId: schedule._id,
      passengerId: "rider-123",
      passengerSnapshot: {
        name: "Test Rider",
        email: "rider@test.com",
        role: "rider",
      },
      boardingStationId: stationA._id,
      boardingStationName: "Colombo Fort",
      destinationStationId: stationB._id,
      destinationStationName: "Kandy",
      travelDate: "2026-04-20",
      travelDay: "Mon",
      seats: 1,
      totalFareLkr: 250,
      bookingStatus: "booked",
      paymentStatus: "paid",
      journeySnapshot: {
        trainNo: "ICE-101",
        trainName: "Intercity Express",
      },
    });

    const res = await request(app).patch(`/api/train/bookings/${booking._id}/cancel`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Paid bookings cannot be cancelled/i);
  });
});