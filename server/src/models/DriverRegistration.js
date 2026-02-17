import mongoose from "mongoose";

const DriverRegistrationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["NOT_SUBMITTED", "PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    driverId: { type: String, default: null }, // set after admin approval

    // Driver details
    nic: { type: String, required: true },
    address: { type: String, required: true },
    age: { type: Number, required: true },
    licenseNumber: { type: String, required: true },
    licenseImageUrl: { type: String, required: true },

    // Vehicle details
    vehicleType: {
      type: String,
      enum: ["car", "mini_car", "van", "mini_van", "suv"],
      required: true,
    },
    vehicleNumber: { type: String, required: true },
    vehicleColor: { type: String, required: true },
    totalSeats: { type: Number, required: true },
    vehiclePhotoUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("DriverRegistration", DriverRegistrationSchema);
