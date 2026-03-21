import mongoose from "mongoose";

const BusSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    busName: { type: String, trim: true, default: "" },
    plateNumber: { type: String, required: true, trim: true, uppercase: true, index: true },
    busType: {
      type: String,
      enum: ["AC", "Non-AC", "Luxury", "Normal"],
      default: "Normal",
    },
    seatsTotal: { type: Number, required: true, min: 1 },
    color: { type: String, trim: true, default: "" },
    photoUrl: { type: String, default: "" },

    // Governance lifecycle
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewNote: { type: String, default: "" },
  },
  { timestamps: true }
);

BusSchema.index({ owner: 1, plateNumber: 1 }, { unique: true });

export const Bus = mongoose.model("Bus", BusSchema);