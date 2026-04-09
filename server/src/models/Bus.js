import mongoose from "mongoose";

export const ALLOWED_SEATS_BY_TYPE = {
  Normal: [42, 44, 49, 54],
  "Semi-luxury": [32, 35, 40],
  Luxury: [45, 49, 50],
  Expressway: [32, 35, 40, 45, 49, 50],
};

const BusSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    plateNumber: { type: String, required: true, trim: true, uppercase: true, index: true },

    busType: {
      type: String,
      enum: ["Normal", "Semi-luxury", "Luxury", "Expressway"],
      default: "Normal",
    },

    color: { type: String, trim: true, default: "" },

    seatsTotal: {
      type: Number,
      required: true,
      validate: {
        validator(value) {
          const allowedSeats = ALLOWED_SEATS_BY_TYPE[this.busType] || [];
          return allowedSeats.includes(Number(value));
        },
        message(props) {
          const busType = this?.busType || "selected bus type";
          const allowedSeats = ALLOWED_SEATS_BY_TYPE[busType] || [];
          return `Invalid seat count for ${busType}. Allowed values: ${allowedSeats.join(", ")}`;
        },
      },
    },

    features: {
      type: [String],
      default: [],
    },

    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "BusRoute", required: true, index: true },

    photoUrl: { type: String, default: "" },
    registrationPhotoUrl: { type: String, default: "" },
    permitPhotoUrl: { type: String, default: "" },

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
export default Bus;