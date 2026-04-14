import express from "express";
import request from "supertest";
import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import {
  verifyTrainTicketCode,
  markTrainTicketAsUsed,
} from "../../src/modules/train/controllers/trainAdminTicketVerify.controller.js";

import { TrainBooking } from "../../src/modules/train/models/TrainBooking.js";
import { TrainSchedule } from "../../src/modules/train/models/TrainSchedule.js";
import { Station } from "../../src/modules/train/models/Station.js";

let mongo;

function fakeRequireAuth(req, res, next) {
  req.user = {
    sub: "admin-1",
    name: "Train Admin",
    email: "admin@test.com",
    role: "ADMIN_TRAIN",
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
    "/api/admin/train/tickets/verify",
    fakeRequireAuth,
    fakeRequireRole("ADMIN_TRAIN"),
    verifyTrainTicketCode
  );

  app.patch(
    "/api/admin/train/tickets/:id/mark-used",
    fakeRequireAuth,
    fakeRequireRole("ADMIN_TRAIN"),
    markTrainTicketAsUsed
  );

  app.use(errorHandler);
  return app;
}

describe("Train ticket verify integration", () => {
  let app;
  let schedule;
  let stationA;
  let stationB;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create({
      binary: { version: "7.0.14" },
    });

    await mongoose.connect(mongo.getUri());
    app = buildApp();
  }, 60000);

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
      }
    } finally {
      if (mongo) {
        await mongo.stop();
      }
    }
  }, 60000);

  beforeEach(async () => {
    await TrainBooking.deleteMany({});
    await TrainSchedule.deleteMany({});
    await Station.deleteMany({});

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

  it("returns 400 when code is missing", async () => {
    const res = await request(app).post("/api/admin/train/tickets/verify").send(
      {}
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/code is required/i);
  });

  it("returns not_found when ticket code does not exist", async () => {
    const res = await request(app)
      .post("/api/admin/train/tickets/verify")
      .send({ code: "TRN-UNKNOWN" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.verificationStatus).toBe("not_found");
    expect(res.body.booking).toBe(null);
  });

  it("verifies a valid paid booking", async () => {
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
      travelDate: "2099-04-20",
      travelDay: "Mon",
      seats: 1,
      totalFareLkr: 250,
      bookingStatus: "booked",
      paymentStatus: "paid",
      ticketNumber: "TRN-1001",
      ticketUsageStatus: "unused",
      journeySnapshot: {
        trainNo: "ICE-101",
        trainName: "Intercity Express",
      },
    });

    const res = await request(app)
      .post("/api/admin/train/tickets/verify")
      .send({ code: "TRN-1001" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.verificationStatus).toBe("valid");
    expect(res.body.booking.ticketNumber).toBe("TRN-1001");
  });

  it("marks a valid ticket as used", async () => {
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
      travelDate: "2099-04-20",
      travelDay: "Mon",
      seats: 1,
      totalFareLkr: 250,
      bookingStatus: "booked",
      paymentStatus: "paid",
      ticketNumber: "TRN-2001",
      ticketUsageStatus: "unused",
      journeySnapshot: {
        trainNo: "ICE-101",
        trainName: "Intercity Express",
      },
    });

    const res = await request(app).patch(
      `/api/admin/train/tickets/${booking._id}/mark-used`
    );

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.verificationStatus).toBe("already_used");
    expect(res.body.booking.ticketUsageStatus).toBe("used");
  });
});