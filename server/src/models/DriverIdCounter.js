import mongoose from "mongoose";

const DriverIdCounterSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true, unique: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const DriverIdCounter = mongoose.model("DriverIdCounter", DriverIdCounterSchema);
