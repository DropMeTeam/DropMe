import { Review } from '../models/Review.js';
import mongoose from 'mongoose';
import { 
    RegExpMatcher, 
    englishDataset, 
    englishRecommendedTransformers,
    TextCensor,
    AsteriskStrategy
} from 'obscenity';

// 1. Setup the matcher and censor (Done once outside the function)
const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
});
const censor = new TextCensor().setStrategy(new AsteriskStrategy());

// export const createReview = async (req, res) => {
//   try {
//     const { comment, rating, revieweeId, rideId, categories } = req.body;

//     // 2. Check for matches
//     const matches = matcher.getAllMatches(comment);
//     const containsProfanity = matches.length > 0;
    
//     // 3. Censor the text (e.g., "" -> "****")
//     const cleanComment = censor.applyTo(comment, matches);

//     const newReview = new Review({
//       rideId,
//       reviewerId: req.user.id, 
//       revieweeId,
//       rating,
//       comment: cleanComment,
//       categories,
//       isFlagged: containsProfanity 
//     });

//     await newReview.save();
//     res.status(201).json({ message: "Review submitted successfully", review: newReview });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

export const createReview = async (req, res) => {
  try {
    const { comment, rating, revieweeId, rideId, categories } = req.body;

    // Default to empty string if no comment provided
    const rawComment = comment || "";
    const matches = matcher.getAllMatches(rawComment);
    const cleanComment = rawComment ? censor.applyTo(rawComment, matches) : "";

    const newReview = new Review({
      rideId,
      reviewerId: req.user.id, 
      revieweeId: new mongoose.Types.ObjectId(revieweeId),
      rating,
      comment: cleanComment,
      categories: {
        cleanliness: categories?.cleanliness || 5,
        punctuality: categories?.punctuality || 5,
        behavior: categories?.behavior || 5
      },
      isFlagged: matches.length > 0 
    });

    await newReview.save();
    res.status(201).json({ message: "Review submitted", review: newReview });
  } catch (error) {
    res.status(500).json({ error: "Failed to save review" });
  }
};

export const getDriverStats = async (req, res) => {
  try {
    const { driverId } = req.params;

    // Use mongoose.Types.ObjectId if driverId is a string from params
    const stats = await Review.aggregate([
      { $match: { revieweeId: new mongoose.Types.ObjectId(driverId) } },
      {
        $group: {
          _id: "$revieweeId",
          avgRating: { $avg: "$rating" },
          avgCleanliness: { $avg: "$categories.cleanliness" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json(stats[0] || { message: "No reviews yet", avgRating: 0, totalReviews: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};