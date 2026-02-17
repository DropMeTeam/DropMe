import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    rideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true },
    riderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },

    seatsBooked: { type: Number, required: true },
    estFare: { type: Number, default: null },

    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", BookingSchema);
