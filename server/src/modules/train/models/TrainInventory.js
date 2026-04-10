import mongoose from "mongoose";

const trainInventorySchema = new mongoose.Schema(
  {
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrainSchedule",
      required: true,
      index: true,
    },

    travelDate: {
      type: String,
      required: true,
      index: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    bookedSeats: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

trainInventorySchema.index(
  { scheduleId: 1, travelDate: 1 },
  { unique: true }
);

export const TrainInventory =
  mongoose.models.TrainInventory ||
  mongoose.model("TrainInventory", trainInventorySchema);