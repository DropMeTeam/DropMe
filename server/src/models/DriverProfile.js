import mongoose from "mongoose";

const DriverProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, unique: true },

    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
    },

    driverId: { type: String, default: null }, // D/2026/14

    nic: { type: String, required: true },
    address: { type: String, required: true },
    age: { type: Number, required: true },
    licenseNumber: { type: String, required: true },
    licenseImageUrl: { type: String, required: true },

    vehicle: {
      type: {
        type: String,
        enum: ["car", "mini_car", "van", "mini_van", "suv"],
        required: true,
      },
      number: { type: String, required: true },
      color: { type: String, required: true },
      seatsTotal: { type: Number, required: true },
      photoUrl: { type: String, required: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model("DriverProfile", DriverProfileSchema);
