import mongoose from "mongoose";

const GeoPointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  { _id: false }
);

const LocationSchema = new mongoose.Schema(
  {
    point: { type: GeoPointSchema, required: true },
    address: { type: String, default: "" }
  },
  { _id: false }
);

const RideRequestSchema = new mongoose.Schema(
  {
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    origin: { type: LocationSchema, required: true },
    destination: { type: LocationSchema, required: true },
    pickupTime: { type: Date, required: true, index: true },
    timeWindowMins: { type: Number, default: 15, min: 0, max: 120 },
    seatsNeeded: { type: Number, default: 1, min: 1, max: 2 },
    mode: { type: String, enum: ["POOL", "PRIVATE", "TRANSIT"], default: "POOL" },
    status: { type: String, enum: ["open", "matched", "cancelled"], default: "open", index: true }
  },
  { timestamps: true }
);

RideRequestSchema.index({ "origin.point": "2dsphere" });
RideRequestSchema.index({ "destination.point": "2dsphere" });

export const RideRequest = mongoose.model("RideRequest", RideRequestSchema);
