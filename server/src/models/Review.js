import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RideBooking",
      required: true,
      index: true,
    },

    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RideOffer",
      required: true,
      index: true,
    },

    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    overallRating: { type: Number, required: true, min: 1, max: 5 },
    cleanlinessRating: { type: Number, required: true, min: 1, max: 5 },
    punctualityRating: { type: Number, required: true, min: 1, max: 5 },
    behaviorRating: { type: Number, required: true, min: 1, max: 5 },

    originalText: { type: String, default: "", trim: true, maxlength: 1000 },
    sanitizedText: { type: String, default: "", trim: true, maxlength: 1000 },

    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "hidden"],
      default: "pending",
      index: true,
    },

    isVisible: { type: Boolean, default: false },

    profanityLevel: {
      type: String,
      enum: ["none", "mild", "moderate", "severe"],
      default: "none",
    },

    geminiFlagged: { type: Boolean, default: false },
    geminiConfidence: { type: Number, default: 0 },
    geminiReason: { type: String, default: "" },

    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    moderatedAt: { type: Date, default: null },
    moderationReason: { type: String, default: "" },
  },
  { timestamps: true }
);

// one passenger can review one completed booking only once
ReviewSchema.index({ bookingId: 1, reviewerId: 1 }, { unique: true });

export const Review = mongoose.model("Review", ReviewSchema);