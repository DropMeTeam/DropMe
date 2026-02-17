import mongoose from "mongoose";

const PointSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
  },
  { _id: false }
);

const RideSchema = new mongoose.Schema(
  {
    driverUserId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    driverProfileId: { type: mongoose.Schema.Types.ObjectId, ref: "DriverProfile", required: true },
    driverId: { type: String, required: true }, // D/2026/14

    origin: { type: PointSchema, required: true },
    destination: { type: PointSchema, required: true },

    routePoints: { type: [[Number]], default: [] }, // [[lat,lng],...], optional for UI
    distanceMeters: { type: Number, default: null },
    durationSeconds: { type: Number, default: null },

    costPerKm: { type: Number, required: true },
    seatsTotal: { type: Number, required: true },
    seatsAvailable: { type: Number, required: true },

    departAt: { type: Date, required: true },
    status: { type: String, enum: ["active", "cancelled", "completed"], default: "active" },
  },
  { timestamps: true }
);

RideSchema.index({ "origin.location": "2dsphere" });
RideSchema.index({ "destination.location": "2dsphere" });

export default mongoose.model("Ride", RideSchema);
