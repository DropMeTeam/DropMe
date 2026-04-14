import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";

import {
  getMyDriverRegistration,
  submitDriverRegistration,
} from "../../src/controllers/driverRegistration.controller.js";

import { User } from "../../src/models/User.js";

let mongo;

/**
 * Fake auth middleware for testing
 * Change req.user role inside each route wrapper when needed.
 */
function fakeAuthAs(role = "driver", userId = null) {
  return (req, res, next) => {
    req.user = {
      sub: userId || req.headers["x-test-user-id"],
      role,
      name: "Test User",
      email: "test@example.com",
    };
    next();
  };
}

/**
 * Fake upload middleware
 * We skip real multer here and just inject req.files for integration testing.
 */
function fakeUploadFields(req, res, next) {
  req.files = {
    licenseImage: [{ filename: "license-test.jpg" }],
    vehiclePhoto: [{ filename: "vehicle-test.jpg" }],
  };
  next();
}

function errorHandler(err, req, res, next) {
  res.status(err.statusCode || err.status || 500).json({
    message: err.message || "Server error",
  });
}

function buildApp() {
  const app = express();
  app.use(express.json());

  // GET /api/driver-registration/me
  app.get(
    "/api/driver-registration/me",
    fakeAuthAs(),
    getMyDriverRegistration
  );

  // POST /api/driver-registration/submit
  app.post(
    "/api/driver-registration/submit",
    fakeAuthAs(),
    fakeUploadFields,
    submitDriverRegistration
  );

  // Route for non-driver role testing
  app.post(
    "/api/driver-registration/submit-as-rider",
    fakeAuthAs("rider"),
    fakeUploadFields,
    submitDriverRegistration
  );

  app.use(errorHandler);
  return app;
}

describe("Private driver registration integration", () => {
  let app;
  let driverUser;
  let riderUser;

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
    await User.deleteMany({});

    driverUser = await User.create({
      name: "Driver User",
      email: "driver@test.com",
      passwordHash: "hashed-password",
      role: "driver",
      driverRegistration: {},
    });

    riderUser = await User.create({
      name: "Rider User",
      email: "rider@test.com",
      passwordHash: "hashed-password",
      role: "rider",
      driverRegistration: {},
    });
  });

  it("gets my driver registration successfully", async () => {
    const res = await request(app)
      .get("/api/driver-registration/me")
      .set("x-test-user-id", String(driverUser._id));

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(String(driverUser._id));
    expect(res.body.user.role).toBe("driver");
    expect(res.body.driverRegistration).toBeTruthy();
  });

  it("submits driver registration successfully", async () => {
    const res = await request(app)
      .post("/api/driver-registration/submit")
      .set("x-test-user-id", String(driverUser._id))
      .send({
        nic: "200012345678",
        address: "Colombo",
        age: 28,
        licenseNo: "B1234567",
        vehicleType: "car",
        vehicleNumber: "CAB-1234",
        vehicleColor: "Black",
        seatsTotal: 4,
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.driverRegistration.status).toBe("pending");
    expect(res.body.driverRegistration.nic).toBe("200012345678");
    expect(res.body.driverRegistration.licenseNo).toBe("B1234567");
    expect(res.body.driverRegistration.vehicle.type).toBe("car");
    expect(res.body.driverRegistration.vehicle.number).toBe("CAB-1234");
    expect(res.body.driverRegistration.vehicle.seatsTotal).toBe(4);
  });

  it("returns 403 when non-driver user tries to submit registration", async () => {
    const res = await request(app)
      .post("/api/driver-registration/submit-as-rider")
      .set("x-test-user-id", String(riderUser._id))
      .send({
        nic: "200012345678",
        address: "Colombo",
        age: 28,
        licenseNo: "B1234567",
        vehicleType: "car",
        vehicleNumber: "CAB-1234",
        vehicleColor: "Black",
        seatsTotal: 4,
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Only drivers can submit registration/i);
  });

  it("returns 400 when driver details are missing", async () => {
    const res = await request(app)
      .post("/api/driver-registration/submit")
      .set("x-test-user-id", String(driverUser._id))
      .send({
        address: "Colombo",
        age: 28,
        licenseNo: "B1234567",
        vehicleType: "car",
        vehicleNumber: "CAB-1234",
        vehicleColor: "Black",
        seatsTotal: 4,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Missing driver details/i);
  });

  it("returns 400 when vehicle details are missing", async () => {
    const res = await request(app)
      .post("/api/driver-registration/submit")
      .set("x-test-user-id", String(driverUser._id))
      .send({
        nic: "200012345678",
        address: "Colombo",
        age: 28,
        licenseNo: "B1234567",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Missing vehicle details/i);
  });
});