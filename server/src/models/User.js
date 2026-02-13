import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
  type: String,
  enum: ["rider", "driver", "ADMIN_TRAIN", "ADMIN_BUS", "SUPER_ADMIN"],
  default: "rider",
}

  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
