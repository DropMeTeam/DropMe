// models/RideBooking.js
import mongoose from "mongoose";

const RideBookingSchema = new mongoose.Schema(
  {
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: "RideOffer", required: true, index: true },
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    seatsBooked: { type: Number, required: true, min: 1, max: 6 },

    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },

    // ✅ payment fields
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed", "refunded"],
      default: "unpaid",
      index: true,
    },
    amount: { type: Number, default: 0 }, // store in LKR or your chosen currency
    currency: { type: String, default: "lkr" },
    stripeSessionId: { type: String, default: "" },
    paidAt: { type: Date, default: null },

    note: { type: String, default: "" },
  },
  { timestamps: true }
);

RideBookingSchema.index(
  { offerId: 1, riderId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "confirmed"] } } }
);

export const RideBooking = mongoose.model("RideBooking", RideBookingSchema);