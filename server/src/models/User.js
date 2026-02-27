import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["rider", "driver", "admin"], default: "rider" },
  
    // 🛡️ Review moderation (applies mainly to riders, but stored on user)
    profanityStrikeCount: {
      type: Number,
      default: 0
    },

    lastProfanityAt: {
      type: Date,
      default: null
    },

    reviewBanUntil: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
