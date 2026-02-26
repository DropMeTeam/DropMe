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

    note: { type: String, default: "" },
  },
  { timestamps: true }
);

// Prevent duplicate active bookings for same rider+offer
RideBookingSchema.index(
  { offerId: 1, riderId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "confirmed"] } } }
);

export const RideBooking = mongoose.model("RideBooking", RideBookingSchema);