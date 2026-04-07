import mongoose from "mongoose";

const trainBookingSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrainSchedule",
      required: true,
      index: true,
    },

    passengerId: {
      type: String,
      required: true,
      index: true,
    },

    passengerSnapshot: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },

    boardingStationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },
    boardingStationName: {
      type: String,
      required: true,
      trim: true,
    },

    destinationStationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },
    destinationStationName: {
      type: String,
      required: true,
      trim: true,
    },

    travelDate: {
      type: String,
      required: true,
      index: true,
    },

    travelDay: {
      type: String,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      required: true,
      index: true,
    },

    seats: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    totalFareLkr: {
      type: Number,
      required: true,
      min: 0,
    },

    bookingStatus: {
      type: String,
      enum: ["pending_payment", "booked", "cancelled", "failed"],
      default: "pending_payment",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "cancelled", "failed"],
      default: "pending",
      index: true,
    },

    stripeSessionId: {
      type: String,
      default: "",
      index: true,
    },

    paymentReference: {
      type: String,
      default: "",
    },

    paidAt: {
      type: Date,
      default: null,
    },

    ticketNumber: {
      type: String,
      default: "",
      index: true,
    },

    ticketEmailSentAt: {
      type: Date,
      default: null,
    },

    // Ticket usage for verification
    ticketUsageStatus: {
      type: String,
      enum: ["unused", "used"],
      default: "unused",
      index: true,
    },
    ticketUsedAt: {
      type: Date,
      default: null,
    },
    ticketUsedBy: {
      type: String,
      default: "",
    },

    journeySnapshot: {
      trainNo: { type: String, default: "" },
      trainName: { type: String, default: "" },
      departureTime: { type: String, default: "" },
      arrivalTime: { type: String, default: "" },
      durationLabel: { type: String, default: "" },

      durationMinutes: {
        type: Number,
        default: 0,
        min: 0,
      },

      distanceKm: {
        type: Number,
        default: 0,
        min: 0,
      },

      farePerSeatLkr: {
        type: Number,
        default: 0,
        min: 0,
      },

      fareBreakdownTotalLkr: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  { timestamps: true }
);

trainBookingSchema.index({
  scheduleId: 1,
  travelDate: 1,
  bookingStatus: 1,
  paymentStatus: 1,
});

export const TrainBooking =
  mongoose.models.TrainBooking ||
  mongoose.model("TrainBooking", trainBookingSchema);