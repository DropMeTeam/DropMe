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

const RideOfferSchema = new mongoose.Schema(
  {
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    origin: { type: LocationSchema, required: true },
    destination: { type: LocationSchema, required: true },
    pickupTime: { type: Date, required: true, index: true },
    timeWindowMins: { type: Number, default: 15, min: 0, max: 120 },
    seatsTotal: { type: Number, default: 3, min: 1, max: 6 },
    seatsAvailable: { type: Number, default: 3, min: 0, max: 6 },
    routePolyline: { type: String, default: "" },
    pricing: {
      baseFee: { type: Number, default: 120 },
      pricePerKm: { type: Number, default: 80 },
      poolDiscountPct: { type: Number, default: 20 }
    },
    status: { type: String, enum: ["open", "closed"], default: "open", index: true }
  },
  { timestamps: true }
);

RideOfferSchema.index({ "origin.point": "2dsphere" });
RideOfferSchema.index({ "destination.point": "2dsphere" });

export const RideOffer = mongoose.model("RideOffer", RideOfferSchema);
