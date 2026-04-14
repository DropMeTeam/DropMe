import { beforeAll, afterAll, afterEach, describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Bus from "../models/Bus.js";

let mongo;

describe("Bus model", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();

    await mongoose.connect(mongo.getUri(), {
      dbName: "dropme-test",
    });

    // IMPORTANT:
    // "unique" is enforced by MongoDB index, not by normal Mongoose validation.
    // So we force index creation before running duplicate tests.
    await Bus.init();
  });

  afterEach(async () => {
    await Bus.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
  });

  it("saves a valid bus", async () => {
    const bus = await Bus.create({
      owner: new mongoose.Types.ObjectId(),
      plateNumber: "NB-1234",
      busType: "Normal",
      seatsTotal: 42,
      routeId: new mongoose.Types.ObjectId(),
    });

    expect(bus._id).toBeTruthy();
    expect(bus.status).toBe("pending");
  });

  it("fails for invalid seat count", async () => {
    await expect(
      Bus.create({
        owner: new mongoose.Types.ObjectId(),
        plateNumber: "NB-1235",
        busType: "Normal",
        seatsTotal: 40,
        routeId: new mongoose.Types.ObjectId(),
      })
    ).rejects.toThrow(/Invalid seat count/);
  });

  it("defaults status to pending", async () => {
    const bus = await Bus.create({
      owner: new mongoose.Types.ObjectId(),
      plateNumber: "NB-1236",
      busType: "Luxury",
      seatsTotal: 45,
      routeId: new mongoose.Types.ObjectId(),
    });

    expect(bus.status).toBe("pending");
  });

  it("stores plateNumber in uppercase", async () => {
    const bus = await Bus.create({
      owner: new mongoose.Types.ObjectId(),
      plateNumber: "nb-1237",
      busType: "Normal",
      seatsTotal: 42,
      routeId: new mongoose.Types.ObjectId(),
    });

    expect(bus.plateNumber).toBe("NB-1237");
  });

  it("rejects duplicate plate number for same owner", async () => {
    const ownerId = new mongoose.Types.ObjectId();

    await Bus.create({
      owner: ownerId,
      plateNumber: "NB-1238",
      busType: "Normal",
      seatsTotal: 42,
      routeId: new mongoose.Types.ObjectId(),
    });

    await expect(
      Bus.create({
        owner: ownerId,
        plateNumber: "NB-1238",
        busType: "Normal",
        seatsTotal: 44,
        routeId: new mongoose.Types.ObjectId(),
      })
    ).rejects.toMatchObject({
      code: 11000,
    });
  });

  it("allows same plate number for different owners", async () => {
    const bus1 = await Bus.create({
      owner: new mongoose.Types.ObjectId(),
      plateNumber: "NB-1239",
      busType: "Normal",
      seatsTotal: 42,
      routeId: new mongoose.Types.ObjectId(),
    });

    const bus2 = await Bus.create({
      owner: new mongoose.Types.ObjectId(),
      plateNumber: "NB-1239",
      busType: "Luxury",
      seatsTotal: 45,
      routeId: new mongoose.Types.ObjectId(),
    });

    expect(bus1._id).toBeTruthy();
    expect(bus2._id).toBeTruthy();
  });
});