import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

// Small reusable snapshot so leaderboard can show names without extra joins.
const userSnapshotSchema = new Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  { _id: false }
);

// Baseline / actual blocks.
const impactBlockSchema = new Schema(
  {
    activityId: { type: String, default: "" },
    co2eKg: { type: Number, default: 0 },
    occupancyApplied: { type: Number, default: null },
  },
  { _id: false }
);

const carbonImpactSchema = new Schema(
  {
    // The user who earned the eco result.
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Handy for leaderboard display.
    userSnapshot: {
      type: userSnapshotSchema,
      default: () => ({}),
    },

    // Which source created this carbon record.
    sourceType: {
      type: String,
      enum: ["bus_booking", "train_booking", "ride_booking"],
      required: true,
    },

    // Original booking id.
    sourceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    // Real travel mode used by the user.
    mode: {
      type: String,
      enum: ["bus", "train", "carpool"],
      required: true,
    },

    // Distance for the passenger journey.
    distanceKm: {
      type: Number,
      required: true,
      min: 0,
    },

    // Passenger count that this booking represents.
    passengerCount: {
      type: Number,
      required: true,
      min: 1,
    },

    // What emissions would have been if the passenger used a solo private car.
    baseline: {
      type: impactBlockSchema,
      required: true,
    },

    // What emissions happened in the chosen mode.
    actual: {
      type: impactBlockSchema,
      required: true,
    },

    // Positive savings only.
    savedKg: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // Optional petrol-equivalent estimate.
    avoidedFuelLiters: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Gamification points.
    points: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Useful when you later change factor versions.
    factorVersion: {
      type: String,
      default: "",
    },

    // When the trip effectively happened.
    occurredAt: {
      type: Date,
      required: true,
      index: true,
    },

    // Extra booking meta for debugging / audit.
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// One booking should only create one carbon impact row.
carbonImpactSchema.index(
  { sourceType: 1, sourceId: 1 },
  { unique: true }
);

// Helpful for user history queries.
carbonImpactSchema.index({ userId: 1, occurredAt: -1 });

// Helpful for monthly leaderboard sorting.
carbonImpactSchema.index({ occurredAt: -1, points: -1 });

export default models.CarbonImpact || model("CarbonImpact", carbonImpactSchema);