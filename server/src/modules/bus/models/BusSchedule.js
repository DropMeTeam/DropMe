import mongoose from "mongoose";

const StopTimeSchema = new mongoose.Schema(
  {
    stopIndex: { type: Number, required: true }, // position in ordered list
    label: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    time: { type: String, required: true }, // "HH:mm"
  },
  { _id: false }
);

const BusScheduleSchema = new mongoose.Schema(
  {
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "BusRoute", required: true },
    busId: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },

    // A_TO_B: start->end, B_TO_A: end->start
    direction: { type: String, enum: ["A_TO_B", "B_TO_A"], required: true },

    // 0=Sun ... 6=Sat
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },

    stopTimes: { type: [StopTimeSchema], default: [] },
  },
  { timestamps: true }
);

// Prevent duplicates: same route + direction + day + bus
BusScheduleSchema.index(
  { routeId: 1, busId: 1, direction: 1, dayOfWeek: 1 },
  { unique: true }
);

export default mongoose.model("BusSchedule", BusScheduleSchema);