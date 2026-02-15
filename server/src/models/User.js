import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ["rider", "driver", "ADMIN_TRAIN", "ADMIN_BUS", "ADMIN_PRIVATE", "SUPER_ADMIN", "SYSTEM_ADMIN"],
      default: "rider",
    },

    // ✅ NEW: admin approval workflow
    adminStatus: {
      type: String,
      enum: ["approved", "pending", "denied"],
      default: "approved", // normal users are approved by default
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
