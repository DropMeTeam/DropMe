import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  rideId: { type: String, required: true }, // Will link to team's Ride model later
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  // Category ratings for detailed analytics
  categories: {
    cleanliness: { type: Number, default: 5 },
    punctuality: { type: Number, default: 5 },
    behavior: { type: Number, default: 5 }
  },
  isFlagged: { type: Boolean, default: false }, // For Admin Moderation
  createdAt: { type: Date, default: Date.now }
});

export const Review = mongoose.model('Review', reviewSchema);