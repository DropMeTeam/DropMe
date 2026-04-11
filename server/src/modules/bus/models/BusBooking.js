import mongoose from "mongoose";

const StopSnapshotSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    stopIndex: { type: Number, required: true, min: 0 },
    time: { type: String, default: "" },
  },
  { _id: false }
);

const PassengerSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    role: { type: String, default: "" },
  },
  { _id: false }
);

const JourneySnapshotSchema = new mongoose.Schema(
  {
    routeNumber: { type: String, default: "" },
    routeLabel: { type: String, default: "" },
    busNumber: { type: String, default: "" },
    busType: { type: String, default: "" },
    passengerDistanceKm: { type: Number, default: 0, min: 0 },
    farePerSeatLkr: { type: Number, default: 0, min: 0 },
    totalAmountLkr: { type: Number, default: 0, min: 0 },
    stopTimes: {
      type: [
        new mongoose.Schema(
          {
            stopIndex: Number,
            label: String,
            time: String,
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { _id: false }
);

const BusBookingSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusSchedule",
      required: true,
      index: true,
    },

    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusRoute",
      required: true,
      index: true,
    },

    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: true,
      index: true,
    },

    passengerId: {
      type: String,
      required: true,
      index: true,
    },

    passengerSnapshot: {
      type: PassengerSnapshotSchema,
      default: () => ({}),
    },

    travelDate: {
      type: String,
      required: true,
      index: true,
    },

    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
      index: true,
    },

    pickupStop: {
      type: StopSnapshotSchema,
      required: true,
    },

    dropoffStop: {
      type: StopSnapshotSchema,
      required: true,
    },

    seatNumbers: {
      type: [String],
      required: true,
      default: [],
    },

    segmentKeys: {
      type: [String],
      required: true,
      default: [],
    },

    farePerSeatLkr: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmountLkr: {
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

    journeySnapshot: {
      type: JourneySnapshotSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

BusBookingSchema.index({
  scheduleId: 1,
  travelDate: 1,
  bookingStatus: 1,
  paymentStatus: 1,
});

export const BusBooking =
  mongoose.models.BusBooking ||
  mongoose.model("BusBooking", BusBookingSchema);