import express from "express";
import request from "supertest";
import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { listActiveStations } from "../../src/modules/train/controllers/trainPublicStations.controller.js";
import { Station } from "../../src/modules/train/models/Station.js";

let mongo;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.get("/api/train/stations", listActiveStations);
  return app;
}

describe("Train public stations integration", () => {
  let app;

  beforeAll(async () => {
  mongo = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });

  await mongoose.connect(mongo.getUri());
  app = buildApp();
}, 1500000); // 25 minutes

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
    if (mongoose.connection.readyState === 1) {
      await Station.deleteMany({});
    }
  });

  it("returns only active stations", async () => {
    await Station.create([
      {
        name: "Colombo Fort",
        address: "Colombo",
        location: { lat: 6.9344, lng: 79.8428 },
        isActive: true,
      },
      {
        name: "Old Station",
        address: "Hidden",
        location: { lat: 6.9, lng: 79.8 },
        isActive: false,
      },
    ]);

    const res = await request(app).get("/api/train/stations");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.stations)).toBe(true);
    expect(res.body.stations).toHaveLength(1);
    expect(res.body.stations[0].name).toBe("Colombo Fort");
  });
});