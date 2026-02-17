import mongoose from "mongoose";

const StationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: "" }, // ✅ new (optional)
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);


// basic index for geo-like searches (not true 2dsphere, but good enough for now)
StationSchema.index({ "location.lat": 1, "location.lng": 1 });

export const Station =
  mongoose.models.Station || mongoose.model("Station", StationSchema);
