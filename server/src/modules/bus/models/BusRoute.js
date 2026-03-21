import mongoose from "mongoose";

const PointSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  { _id: false }
);

const StopSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    label: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  { _id: false }
);

const BusRouteSchema = new mongoose.Schema(
  {
    routeNumber: { type: String, required: true, unique: true, trim: true },
    routeType: { type: String, enum: ["NORMAL", "EXPRESS"], required: true },

    start: { type: PointSchema, required: true },
    end: { type: PointSchema, required: true },

    stops: { type: [StopSchema], default: [] }
  },
  { timestamps: true }
);

BusRouteSchema.index({ routeType: 1 });
BusRouteSchema.index({ "start.label": "text", "end.label": "text" });

export default mongoose.model("BusRoute", BusRouteSchema);
