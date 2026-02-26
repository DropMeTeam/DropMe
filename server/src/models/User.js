import mongoose from "mongoose";

const VehicleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["car", "mini car", "van", "mini van", "suv"],
      required: true,
    },
    number: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    seatsTotal: { type: Number, required: true, min: 1 },
    photoUrl: { type: String, default: "" },
  },
  { _id: false }
);

const DriverRegistrationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
    },
    driverId: { type: String, default: "" }, // D/2026/14
    nic: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    age: { type: Number, min: 16 },
    licenseNo: { type: String, default: "", trim: true },
    licenseImageUrl: { type: String, default: "" },
    vehicle: { type: VehicleSchema, default: null },

    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewNote: { type: String, default: "" },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ["rider", "driver", "ADMIN_TRAIN", "ADMIN_BUS", "ADMIN_PRIVATE"],
      default: "rider",
    },

    avatarUrl: { type: String, default: "" },

    // ✅ Driver registration + vehicle info (managed by admin approval)
    driverRegistration: { type: DriverRegistrationSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
