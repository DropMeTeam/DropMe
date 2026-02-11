import mongoose from "mongoose";

const MatchSchema = new mongoose.Schema(
  {
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: "RideOffer", required: true, index: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "RideRequest", required: true, index: true },
    score: { type: Number, required: true },
    status: { type: String, enum: ["proposed", "accepted", "rejected", "expired"], default: "proposed", index: true }
  },
  { timestamps: true }
);

MatchSchema.index({ offerId: 1, requestId: 1 }, { unique: true });

export const Match = mongoose.model("Match", MatchSchema);
