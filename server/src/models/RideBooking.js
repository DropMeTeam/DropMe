// models/RideBooking.js
import mongoose from "mongoose";

const RideBookingSchema = new mongoose.Schema(
  {
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: "RideOffer", required: true, index: true },
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    seatsBooked: { type: Number, required: true, min: 1, max: 6 },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "rejected"],
      default: "confirmed",
      index: true,
    },

    // snapshot for UI (so booking history still shows info even if offer changes)
    driverSnapshot: {
      name: { type: String, default: "" },
      avatarUrl: { type: String, default: "" },
    },
    vehicleSnapshot: {
      type: { type: String, default: "" },
      number: { type: String, default: "" },
      color: { type: String, default: "" },
      photoUrl: { type: String, default: "" },
    },

    pickupTime: { type: Date, default: null },
    originAddress: { type: String, default: "" },
    destinationAddress: { type: String, default: "" },
    priceLkr: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const RideBooking = mongoose.model("RideBooking", RideBookingSchema);