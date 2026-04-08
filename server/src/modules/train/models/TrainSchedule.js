import mongoose from "mongoose";

const StopSchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },
    arrivalTime: { type: String, default: "" },
    departureTime: { type: String, required: true },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const SegmentSchema = new mongoose.Schema(
  {
    fromStationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },
    toStationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },
    distanceKm: {
      type: Number,
      required: true,
      min: 0,
    },

    // required for saving and later calculating journey fares
    fareLkr: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const WeeklyTimetableSchema = new mongoose.Schema(
  {
    Mon: { type: [StopSchema], default: [] },
    Tue: { type: [StopSchema], default: [] },
    Wed: { type: [StopSchema], default: [] },
    Thu: { type: [StopSchema], default: [] },
    Fri: { type: [StopSchema], default: [] },
    Sat: { type: [StopSchema], default: [] },
    Sun: { type: [StopSchema], default: [] },
  },
  { _id: false }
);

const TrainScheduleSchema = new mongoose.Schema(
  {
    trainName: { type: String, trim: true, default: "" },
    trainNo: { type: String, trim: true, required: true },
    seatCapacity: { type: Number, required: true, min: 1 },

    stops: {
      type: [StopSchema],
      validate: (v) => Array.isArray(v) && v.length >= 2,
    },

    segments: { type: [SegmentSchema], default: [] },
    totalDistanceKm: { type: Number, default: 0 },

    weeklyTimetable: { type: WeeklyTimetableSchema, default: () => ({}) },

    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const TrainSchedule =
  mongoose.models.TrainSchedule ||
  mongoose.model("TrainSchedule", TrainScheduleSchema);