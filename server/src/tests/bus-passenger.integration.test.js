import { beforeAll, afterAll, afterEach, describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { BusBooking } from "../modules/bus/models/BusBooking.js";
import BusSchedule from "../modules/bus/models/BusSchedule.js";
import Bus from "../models/Bus.js";

vi.mock("../middleware/auth.js", () => {
  return {
    requireAuth: (req, res, next) => {
      const userId = req.header("x-user-id");
      const role = req.header("x-user-role");

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      req.user = {
        sub: userId,
        id: userId,
        role,
        name: req.header("x-user-name") || "Test Passenger",
        email: req.header("x-user-email") || "passenger@test.com",
      };

      next();
    },
    requireRole:
      (...roles) =>
      (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
          return res.status(403).json({ message: "Forbidden" });
        }
        next();
      },
  };
});

vi.mock("../modules/bus/utils/busTicketPdf.js", () => {
  return {
    generateBusTicketPdfBuffer: vi.fn(async () => Buffer.from("fake-pdf")),
  };
});

let busBookingsRouter;
let mongo;
let app;
let BusRouteModel;

function buildApp(router) {
  const server = express();
  server.use(express.json());
  server.use("/api/bus", router);

  server.use((err, _req, res, _next) => {
    res.status(err.statusCode || err.status || 500).json({
      message: err.message || "Server error",
    });
  });

  return server;
}

async function seedSchedule() {
  const route = await BusRouteModel.create({
    routeNumber: "R-100",
    start: { label: "Dambulla" },
    end: { label: "Kandy" },
  });

  const bus = await Bus.create({
    owner: new mongoose.Types.ObjectId(),
    plateNumber: "NC-2020",
    busType: "Normal",
    seatsTotal: 42,
    routeId: route._id,
  });

  const schedule = await BusSchedule.create({
    routeId: route._id,
    busId: bus._id,
    direction: "A_TO_B",
    dayOfWeek: 1,
    stopTimes: [
      { stopIndex: 0, label: "Dambulla", lat: 7.86, lng: 80.65, time: "08:00" },
      { stopIndex: 1, label: "Matale", lat: 7.47, lng: 80.62, time: "09:00" },
      { stopIndex: 2, label: "Kandy", lat: 7.29, lng: 80.63, time: "10:00" },
    ],
  });

  return { route, bus, schedule };
}

describe("bus passenger integration", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: "dropme-bus-passenger-test" });

    BusRouteModel =
      mongoose.models.BusRoute ||
      mongoose.model(
        "BusRoute",
        new mongoose.Schema(
          {
            routeNumber: String,
            start: { label: String },
            end: { label: String },
          },
          { timestamps: true }
        )
      );

    ({ default: busBookingsRouter } = await import("../modules/bus/routes/bus.bookings.routes.js"));
    app = buildApp(busBookingsRouter);
  });

  afterEach(async () => {
    await BusBooking.deleteMany({});
    await BusSchedule.deleteMany({});
    await Bus.deleteMany({});
    await BusRouteModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
  });

  it("returns 400 when scheduleId is missing in availability", async () => {
    const res = await request(app).get("/api/bus/bookings/availability");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/scheduleId is required/i);
  });

  it("returns 400 when travelDate does not match schedule day", async () => {
    const { schedule } = await seedSchedule();

    const res = await request(app).get("/api/bus/bookings/availability").query({
      scheduleId: String(schedule._id),
      travelDate: "2026-04-14",
      pickupLabel: "Dambulla",
      dropoffLabel: "Kandy",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not match this schedule day/i);
  });

  it("blocks checkout when user is not logged in", async () => {
    const { schedule } = await seedSchedule();

    const res = await request(app).post("/api/bus/bookings/checkout").send({
      scheduleId: String(schedule._id),
      travelDate: "2026-04-13",
      pickupLabel: "Dambulla",
      dropoffLabel: "Kandy",
      seatNumbers: ["A1"],
    });

    expect(res.status).toBe(401);
  });

  it("creates a pending bus booking checkout for rider", async () => {
    const { schedule } = await seedSchedule();

    const res = await request(app)
      .post("/api/bus/bookings/checkout")
      .set("x-user-id", "passenger-1")
      .set("x-user-role", "rider")
      .set("x-user-name", "Boy")
      .set("x-user-email", "boy@test.com")
      .send({
        scheduleId: String(schedule._id),
        travelDate: "2026-04-13",
        pickupLabel: "Dambulla",
        dropoffLabel: "Kandy",
        seatNumbers: ["A1", "A2"],
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.booking.bookingStatus).toBe("pending_payment");
    expect(res.body.booking.paymentStatus).toBe("pending");
    expect(res.body.booking.seatNumbers).toEqual(["A1", "A2"]);
  });

  it("rejects checkout when selected seat is already booked for overlapping segment", async () => {
    const { schedule, route, bus } = await seedSchedule();

    await BusBooking.create({
      scheduleId: schedule._id,
      routeId: route._id,
      busId: bus._id,
      passengerId: "passenger-old",
      travelDate: "2026-04-13",
      dayOfWeek: 1,
      pickupStop: { label: "Dambulla", stopIndex: 0, time: "08:00" },
      dropoffStop: { label: "Kandy", stopIndex: 2, time: "10:00" },
      seatNumbers: ["A1"],
      segmentKeys: ["0-1", "1-2"],
      farePerSeatLkr: 100,
      totalAmountLkr: 100,
      bookingStatus: "booked",
      paymentStatus: "paid",
    });

    const res = await request(app)
      .post("/api/bus/bookings/checkout")
      .set("x-user-id", "passenger-new")
      .set("x-user-role", "rider")
      .send({
        scheduleId: String(schedule._id),
        travelDate: "2026-04-13",
        pickupLabel: "Dambulla",
        dropoffLabel: "Kandy",
        seatNumbers: ["A1"],
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/no longer available/i);
  });

  it("returns my bookings only", async () => {
    const { schedule, route, bus } = await seedSchedule();

    await BusBooking.create({
      scheduleId: schedule._id,
      routeId: route._id,
      busId: bus._id,
      passengerId: "passenger-1",
      travelDate: "2026-04-13",
      dayOfWeek: 1,
      pickupStop: { label: "Dambulla", stopIndex: 0, time: "08:00" },
      dropoffStop: { label: "Kandy", stopIndex: 2, time: "10:00" },
      seatNumbers: ["A1"],
      segmentKeys: ["0-1", "1-2"],
      farePerSeatLkr: 100,
      totalAmountLkr: 100,
      bookingStatus: "pending_payment",
      paymentStatus: "pending",
    });

    await BusBooking.create({
      scheduleId: schedule._id,
      routeId: route._id,
      busId: bus._id,
      passengerId: "passenger-2",
      travelDate: "2026-04-13",
      dayOfWeek: 1,
      pickupStop: { label: "Dambulla", stopIndex: 0, time: "08:00" },
      dropoffStop: { label: "Kandy", stopIndex: 2, time: "10:00" },
      seatNumbers: ["A2"],
      segmentKeys: ["0-1", "1-2"],
      farePerSeatLkr: 100,
      totalAmountLkr: 100,
      bookingStatus: "pending_payment",
      paymentStatus: "pending",
    });

    const res = await request(app)
      .get("/api/bus/bookings/mine")
      .set("x-user-id", "passenger-1")
      .set("x-user-role", "rider");

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.bookings[0].passengerId).toBe("passenger-1");
  });

  it("blocks opening another passenger booking", async () => {
    const { schedule, route, bus } = await seedSchedule();

    const booking = await BusBooking.create({
      scheduleId: schedule._id,
      routeId: route._id,
      busId: bus._id,
      passengerId: "owner-passenger",
      travelDate: "2026-04-13",
      dayOfWeek: 1,
      pickupStop: { label: "Dambulla", stopIndex: 0, time: "08:00" },
      dropoffStop: { label: "Kandy", stopIndex: 2, time: "10:00" },
      seatNumbers: ["A1"],
      segmentKeys: ["0-1", "1-2"],
      farePerSeatLkr: 100,
      totalAmountLkr: 100,
      bookingStatus: "pending_payment",
      paymentStatus: "pending",
    });

    const res = await request(app)
      .get(`/api/bus/bookings/${booking._id}`)
      .set("x-user-id", "other-passenger")
      .set("x-user-role", "rider");

    expect(res.status).toBe(403);
  });

  it("allows passenger to cancel unpaid booking", async () => {
    const { schedule, route, bus } = await seedSchedule();

    const booking = await BusBooking.create({
      scheduleId: schedule._id,
      routeId: route._id,
      busId: bus._id,
      passengerId: "passenger-1",
      travelDate: "2026-04-13",
      dayOfWeek: 1,
      pickupStop: { label: "Dambulla", stopIndex: 0, time: "08:00" },
      dropoffStop: { label: "Kandy", stopIndex: 2, time: "10:00" },
      seatNumbers: ["A1"],
      segmentKeys: ["0-1", "1-2"],
      farePerSeatLkr: 100,
      totalAmountLkr: 100,
      bookingStatus: "pending_payment",
      paymentStatus: "pending",
    });

    const res = await request(app)
      .patch(`/api/bus/bookings/${booking._id}/cancel`)
      .set("x-user-id", "passenger-1")
      .set("x-user-role", "rider");

    expect(res.status).toBe(200);
    expect(res.body.booking.bookingStatus).toBe("cancelled");
    expect(res.body.booking.paymentStatus).toBe("cancelled");
  });

  it("blocks cancelling paid booking", async () => {
    const { schedule, route, bus } = await seedSchedule();

    const booking = await BusBooking.create({
      scheduleId: schedule._id,
      routeId: route._id,
      busId: bus._id,
      passengerId: "passenger-1",
      travelDate: "2026-04-13",
      dayOfWeek: 1,
      pickupStop: { label: "Dambulla", stopIndex: 0, time: "08:00" },
      dropoffStop: { label: "Kandy", stopIndex: 2, time: "10:00" },
      seatNumbers: ["A1"],
      segmentKeys: ["0-1", "1-2"],
      farePerSeatLkr: 100,
      totalAmountLkr: 100,
      bookingStatus: "booked",
      paymentStatus: "paid",
    });

    const res = await request(app)
      .patch(`/api/bus/bookings/${booking._id}/cancel`)
      .set("x-user-id", "passenger-1")
      .set("x-user-role", "rider");

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/cannot be cancelled/i);
  });

  it("allows paid and booked ticket pdf download for owner", async () => {
    const { schedule, route, bus } = await seedSchedule();

    const booking = await BusBooking.create({
      scheduleId: schedule._id,
      routeId: route._id,
      busId: bus._id,
      passengerId: "passenger-1",
      travelDate: "2026-04-13",
      dayOfWeek: 1,
      pickupStop: { label: "Dambulla", stopIndex: 0, time: "08:00" },
      dropoffStop: { label: "Kandy", stopIndex: 2, time: "10:00" },
      seatNumbers: ["A1"],
      segmentKeys: ["0-1", "1-2"],
      farePerSeatLkr: 100,
      totalAmountLkr: 100,
      bookingStatus: "booked",
      paymentStatus: "paid",
    });

    const res = await request(app)
      .get(`/api/bus/bookings/${booking._id}/ticket-pdf`)
      .set("x-user-id", "passenger-1")
      .set("x-user-role", "rider");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
  });

  it("blocks ticket pdf download for another user", async () => {
    const { schedule, route, bus } = await seedSchedule();

    const booking = await BusBooking.create({
      scheduleId: schedule._id,
      routeId: route._id,
      busId: bus._id,
      passengerId: "passenger-owner",
      travelDate: "2026-04-13",
      dayOfWeek: 1,
      pickupStop: { label: "Dambulla", stopIndex: 0, time: "08:00" },
      dropoffStop: { label: "Kandy", stopIndex: 2, time: "10:00" },
      seatNumbers: ["A1"],
      segmentKeys: ["0-1", "1-2"],
      farePerSeatLkr: 100,
      totalAmountLkr: 100,
      bookingStatus: "booked",
      paymentStatus: "paid",
    });

    const res = await request(app)
      .get(`/api/bus/bookings/${booking._id}/ticket-pdf`)
      .set("x-user-id", "passenger-other")
      .set("x-user-role", "rider");

    expect(res.status).toBe(403);
  });
});