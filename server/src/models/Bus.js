import mongoose from "mongoose";

const BusSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Bus core identity
    plateNumber: { type: String, required: true, trim: true, uppercase: true, index: true },

    busType: {
      type: String,
      enum: ["Normal", "Semi-luxury", "Luxury", "Expressway"],
      default: "Normal",
    },

    color: { type: String, trim: true, default: "" },

    // enforce your operational limits
    seatsTotal: { type: Number, required: true, min: 25, max: 60 },

    // route binding: must be an admin-created route
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "BusRoute", required: true, index: true },

    // Photos / compliance artifacts
    photoUrl: { type: String, default: "" },              // bus photo
    registrationPhotoUrl: { type: String, default: "" },  // bus registration photo
    permitPhotoUrl: { type: String, default: "" },        // bus permit photo

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