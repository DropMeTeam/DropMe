import { beforeAll, afterAll, afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Bus from "../models/Bus.js";

const busRouteFindByIdMock = vi.fn();

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

vi.mock("../modules/bus/models/BusRoute.js", () => {
  return {
    default: {
      findById: busRouteFindByIdMock,
    },
  };
});

let busOwnerRouter;
let mongo;
let app;
let BusRouteModel;

function buildApp(router) {
  const server = express();
  server.use(express.json());
  server.use("/api/owner", router);

  server.use((err, _req, res, _next) => {
    res.status(err.statusCode || err.status || 500).json({
      message: err.message || "Server error",
    });
  });

  return server;
}

describe("bus owner integration", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: "dropme-bus-owner-test" });

    BusRouteModel =
      mongoose.models.BusRoute ||
      mongoose.model(
        "BusRoute",
        new mongoose.Schema(
          {
            routeNumber: String,
            routeType: String,
            start: {
              label: String,
            },
            end: {
              label: String,
            },
          },
          { timestamps: true }
        )
      );

    ({ busOwnerRouter } = await import("../routes/busOwner.routes.js"));
    app = buildApp(busOwnerRouter);
  });

  beforeEach(() => {
    busRouteFindByIdMock.mockReset();

    // Important:
    // Real route code calls: await BusRoute.findById(routeId).lean()
    // So the mock must return a query-like object that has .lean()
    busRouteFindByIdMock.mockImplementation((id) => ({
      lean: async () => BusRouteModel.findById(id).lean(),
    }));
  });

  afterEach(async () => {
    await Bus.deleteMany({});
    await BusRouteModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
  });

  it("allows BUS_OWNER to list only their own buses", async () => {
    const route = await BusRouteModel.create({
      routeNumber: "R-01",
      routeType: "Town",
      start: { label: "Dambulla" },
      end: { label: "Kandy" },
    });

    await Bus.create({
      owner: new mongoose.Types.ObjectId("000000000000000000000001"),
      plateNumber: "NA-1111",
      busType: "Normal",
      seatsTotal: 42,
      routeId: route._id,
    });

    await Bus.create({
      owner: new mongoose.Types.ObjectId("000000000000000000000002"),
      plateNumber: "NB-2222",
      busType: "Luxury",
      seatsTotal: 45,
      routeId: route._id,
    });

    const res = await request(app)
      .get("/api/owner/buses")
      .set("x-user-id", "000000000000000000000001")
      .set("x-user-role", "BUS_OWNER");

    expect(res.status).toBe(200);
    expect(res.body.buses).toHaveLength(1);
    expect(res.body.buses[0].plateNumber).toBe("NA-1111");
  });

  it("blocks non BUS_OWNER users from listing buses", async () => {
    const res = await request(app)
      .get("/api/owner/buses")
      .set("x-user-id", "000000000000000000000001")
      .set("x-user-role", "rider");

    expect(res.status).toBe(403);
  });

  it("creates a bus with valid payload and files", async () => {
    const route = await BusRouteModel.create({
      routeNumber: "R-02",
      routeType: "Express",
      start: { label: "Colombo" },
      end: { label: "Matara" },
    });

    const res = await request(app)
      .post("/api/owner/buses")
      .set("x-user-id", "000000000000000000000001")
      .set("x-user-role", "BUS_OWNER")
      .field("plateNumber", "nc-3333")
      .field("busType", "Normal")
      .field("color", "Blue")
      .field("seatsTotal", "42")
      .field("routeId", String(route._id))
      .field("features", "wifi")
      .field("features", "ac")
      .attach("busPhoto", Buffer.from("bus-photo"), "bus.jpg")
      .attach("registrationPhoto", Buffer.from("reg-photo"), "reg.jpg")
      .attach("permitPhoto", Buffer.from("permit-photo"), "permit.jpg");

    expect(res.status).toBe(200);
    expect(res.body.bus).toBeTruthy();
    expect(res.body.bus.plateNumber).toBe("NC-3333");
    expect(res.body.bus.status).toBe("pending");
    expect(res.body.bus.features).toEqual(["wifi", "ac"]);
  });

  it("fails when plateNumber is missing", async () => {
    const route = await BusRouteModel.create({
      routeNumber: "R-03",
      routeType: "Town",
      start: { label: "A" },
      end: { label: "B" },
    });

    const res = await request(app)
      .post("/api/owner/buses")
      .set("x-user-id", "000000000000000000000001")
      .set("x-user-role", "BUS_OWNER")
      .field("busType", "Normal")
      .field("seatsTotal", "42")
      .field("routeId", String(route._id))
      .attach("busPhoto", Buffer.from("bus-photo"), "bus.jpg")
      .attach("registrationPhoto", Buffer.from("reg-photo"), "reg.jpg")
      .attach("permitPhoto", Buffer.from("permit-photo"), "permit.jpg");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/plateNumber is required/i);
  });

  it("fails when busType is invalid", async () => {
    const route = await BusRouteModel.create({
      routeNumber: "R-04",
      routeType: "Town",
      start: { label: "A" },
      end: { label: "B" },
    });

    const res = await request(app)
      .post("/api/owner/buses")
      .set("x-user-id", "000000000000000000000001")
      .set("x-user-role", "BUS_OWNER")
      .field("plateNumber", "ND-4444")
      .field("busType", "Super")
      .field("seatsTotal", "42")
      .field("routeId", String(route._id))
      .attach("busPhoto", Buffer.from("bus-photo"), "bus.jpg")
      .attach("registrationPhoto", Buffer.from("reg-photo"), "reg.jpg")
      .attach("permitPhoto", Buffer.from("permit-photo"), "permit.jpg");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid busType/i);
  });

  it("fails when seat count does not match bus type", async () => {
    const route = await BusRouteModel.create({
      routeNumber: "R-05",
      routeType: "Town",
      start: { label: "A" },
      end: { label: "B" },
    });

    const res = await request(app)
      .post("/api/owner/buses")
      .set("x-user-id", "000000000000000000000001")
      .set("x-user-role", "BUS_OWNER")
      .field("plateNumber", "NE-5555")
      .field("busType", "Normal")
      .field("seatsTotal", "40")
      .field("routeId", String(route._id))
      .attach("busPhoto", Buffer.from("bus-photo"), "bus.jpg")
      .attach("registrationPhoto", Buffer.from("reg-photo"), "reg.jpg")
      .attach("permitPhoto", Buffer.from("permit-photo"), "permit.jpg");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid seat count/i);
  });

  it("fails when routeId is missing", async () => {
    const res = await request(app)
      .post("/api/owner/buses")
      .set("x-user-id", "000000000000000000000001")
      .set("x-user-role", "BUS_OWNER")
      .field("plateNumber", "NF-6666")
      .field("busType", "Normal")
      .field("seatsTotal", "42")
      .attach("busPhoto", Buffer.from("bus-photo"), "bus.jpg")
      .attach("registrationPhoto", Buffer.from("reg-photo"), "reg.jpg")
      .attach("permitPhoto", Buffer.from("permit-photo"), "permit.jpg");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/routeId is required/i);
  });

  it("fails when routeId is invalid", async () => {
    // Must return an object with .lean(), because the route does:
    // await BusRoute.findById(routeId).lean()
    busRouteFindByIdMock.mockImplementationOnce(() => ({
      lean: async () => null,
    }));

    const res = await request(app)
      .post("/api/owner/buses")
      .set("x-user-id", "000000000000000000000001")
      .set("x-user-role", "BUS_OWNER")
      .field("plateNumber", "NG-7777")
      .field("busType", "Normal")
      .field("seatsTotal", "42")
      .field("routeId", String(new mongoose.Types.ObjectId()))
      .attach("busPhoto", Buffer.from("bus-photo"), "bus.jpg")
      .attach("registrationPhoto", Buffer.from("reg-photo"), "reg.jpg")
      .attach("permitPhoto", Buffer.from("permit-photo"), "permit.jpg");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/route not found/i);
  });

  it("fails when busPhoto is missing", async () => {
    const route = await BusRouteModel.create({
      routeNumber: "R-06",
      routeType: "Town",
      start: { label: "A" },
      end: { label: "B" },
    });

    const res = await request(app)
      .post("/api/owner/buses")
      .set("x-user-id", "000000000000000000000001")
      .set("x-user-role", "BUS_OWNER")
      .field("plateNumber", "NH-8888")
      .field("busType", "Normal")
      .field("seatsTotal", "42")
      .field("routeId", String(route._id))
      .attach("registrationPhoto", Buffer.from("reg-photo"), "reg.jpg")
      .attach("permitPhoto", Buffer.from("permit-photo"), "permit.jpg");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/busPhoto is required/i);
  });

  it("fails when registrationPhoto is missing", async () => {
    const route = await BusRouteModel.create({
      routeNumber: "R-07",
      routeType: "Town",
      start: { label: "A" },
      end: { label: "B" },
    });

    const res = await request(app)
      .post("/api/owner/buses")
      .set("x-user-id", "000000000000000000000001")
      .set("x-user-role", "BUS_OWNER")
      .field("plateNumber", "NI-9999")
      .field("busType", "Normal")
      .field("seatsTotal", "42")
      .field("routeId", String(route._id))
      .attach("busPhoto", Buffer.from("bus-photo"), "bus.jpg")
      .attach("permitPhoto", Buffer.from("permit-photo"), "permit.jpg");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/registrationPhoto is required/i);
  });

  it("fails when permitPhoto is missing", async () => {
    const route = await BusRouteModel.create({
      routeNumber: "R-08",
      routeType: "Town",
      start: { label: "A" },
      end: { label: "B" },
    });

    const res = await request(app)
      .post("/api/owner/buses")
      .set("x-user-id", "000000000000000000000001")
      .set("x-user-role", "BUS_OWNER")
      .field("plateNumber", "NJ-1010")
      .field("busType", "Normal")
      .field("seatsTotal", "42")
      .field("routeId", String(route._id))
      .attach("busPhoto", Buffer.from("bus-photo"), "bus.jpg")
      .attach("registrationPhoto", Buffer.from("reg-photo"), "reg.jpg");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/permitPhoto is required/i);
  });
});