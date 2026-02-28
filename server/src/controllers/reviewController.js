import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';
import { 
    RegExpMatcher, 
    englishDataset, 
    englishRecommendedTransformers,
    TextCensor
} from 'obscenity';

// 1. Setup the matcher and censor (Done once outside the function)
const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
});
const censor = new TextCensor().setStrategy((match) => '*'.repeat(match.end - match.start));

export const createReview = async (req, res) => {
  try {
    const { comment, rating, revieweeId, rideId, categories, forceSubmit } = req.body;

    // 🛑 DEBUG CHECK: If you haven't logged in, req.user will be undefined.
    // For testing in Postman WITHOUT auth, you can use a fallback ID:
    
    const userId = req.user?.id || req.body.reviewerId; 

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // 2. FETCH THE ACTUAL USER DOCUMENT FROM DB
    // We need this to check bans and increment strikes accurately.
    const dbUser = await User.findById(userId);
    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

     // 🚫 Ban check FIRST
    if (dbUser?.reviewBanUntil && dbUser.reviewBanUntil > new Date()) {
      return res.status(403).json({
        error: "Review privileges suspended",
        message: `You are banned from submitting reviews until ${dbUser.reviewBanUntil.toISOString()}`
      });
    }

    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        error: "Rating is required and must be an integer between 1 and 5",
      });
    }

    // Default to empty string if no comment provided
    const rawComment = comment || "";

    let textForMatching = rawComment
      .toLowerCase()
      .replace(/[\s\-_.,!?]+/g, '');   // remove spaces, dashes, underscores, basic punctuation

    // Optional: also collapse repeated letters (assss → ass)
    textForMatching = textForMatching.replace(/(.)\1{2,}/g, '$1$1');

    // Run obscenity filter
    const matches = matcher.getAllMatches(textForMatching);
    const hasProfanity = matches.length > 0;
    const cleanComment = rawComment ? censor.applyTo(rawComment, matches) : "";

    // ⚠️ WARNING MODE (no force submit yet)
    if (hasProfanity && !forceSubmit) {
      return res.status(400).json({
        warning: true,
        error: "Inappropriate language detected",
        message: "Please use respectful and appropriate language. " +
                 "We're building a kind community for sustainable mobility and shared rides. 🌍 " +
                 "Rephrase your comment and try again. Thank you!",
        field: "comment",
        action: "submit_anyway"
      });
    }

    // save review
    const newReview = new Review({
      rideId,
      // reviewerId: req.user.id, 
      reviewerId: userId, // Uses the ID from auth or body
      revieweeId: revieweeId,
      rating,
      originalComment: rawComment,   // ← save raw
      displayComment: hasProfanity ? cleanComment : rawComment, // ← save censored for public
      categories: {
        cleanliness: categories?.cleanliness || 5,
        punctuality: categories?.punctuality || 5,
        behavior: categories?.behavior || 5
      },
      isFlagged: hasProfanity,
      moderationStatus: hasProfanity ? 'pending' : 'approved' //auto-approve clean reviews 
    });

    await newReview.save();

    // 📊 STRIKE COUNT (ONLY after successful save)
    if (hasProfanity) {
      dbUser.profanityStrikeCount = (dbUser.profanityStrikeCount || 0) + 1;
      dbUser.lastProfanityAt = new Date();

      // ⛔ Escalation
      if (dbUser.profanityStrikeCount === 2) {
        console.log("⚠️ Warning: repeated censored reviews");
      }

      // 1. Level 1: Warning (3 strikes) -> 3 Days
      if (dbUser.profanityStrikeCount === 3) {
        dbUser.reviewBanUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        console.log("🚫 User banned for 3 days");
      }
      // 2. Level 2: Serious (8 strikes) -> 30 Days
      else if (
        dbUser.profanityStrikeCount >= 8 &&
        dbUser.profanityStrikeCount < 20
      ) {
        dbUser.reviewBanUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        console.log("⛔ User banned for 1 month");
      }
      // 3. Level 3: Lifetime Ban (20 strikes) -> Year 3000
      else if (dbUser.profanityStrikeCount >= 20) {
        // Set ban date to 100 years in the future
        dbUser.reviewBanUntil = new Date(
          Date.now() + 100 * 365 * 24 * 60 * 60 * 1000,
        );
        console.log("💀 User permanently banned (Lifetime limit reached)");
      }

      await dbUser.save();
    }

    return res.status(201).json({ 
      message: hasProfanity
        ? "Review submitted. Some language was automatically filtered."
        : "Review submitted successfully.", 
      review: newReview, 
      isFlagged: hasProfanity });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to save review" });
  }
};

// update review old
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, rating, categories } = req.body;
    //const userId = req.user?.id;
     const userId = req.user?.id || req.user?._id || req.body.reviewerId;

    // 1️⃣ Find review
    const oldReview = await Review.findById(id);
    if (!oldReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    // 2️⃣ Authorization
    if (oldReview.reviewerId.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // 3️⃣ 24-hour edit window
    const hoursSinceCreation =
      (Date.now() - oldReview.createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      return res.status(400).json({
        error: "Update window closed",
        message: "Reviews can only be edited within 24 hours."
      });
    }

    // 4️⃣ Process comment
    const rawComment = comment ?? oldReview.originalComment;

    const textForMatching = rawComment
      ?.toLowerCase()
      .replace(/[\s\-_.,!?]+/g, "")
      .replace(/(.)\1{2,}/g, "$1$1");

    const matches = textForMatching
      ? matcher.getAllMatches(textForMatching)
      : [];

    const wasBad = oldReview.isFlagged;
    const isBadNow = matches.length > 0;

    const cleanComment = isBadNow
      ? censor.applyTo(rawComment, matches)
      : rawComment;

    // 5️⃣ Load user
    const dbUser = await User.findById(userId);

    // 6️⃣ Determine strike change
    let strikeChange = 0;
    if (!wasBad && isBadNow) strikeChange = +1;
    if (wasBad && !isBadNow) strikeChange = -1;

    // 7️⃣ Apply strike change
    if (strikeChange !== 0) {
      dbUser.profanityStrikeCount = Math.max(
        0,
        dbUser.profanityStrikeCount + strikeChange
      );

      // 🔓 LIFETIME BAN LIFT (only when strike decreases)
      if (
        strikeChange === -1 &&
        dbUser.profanityStrikeCount < 20 &&
        dbUser.reviewBanUntil
      ) {
        const lifetimeThreshold =
          Date.now() + 50 * 365 * 24 * 60 * 60 * 1000;

        if (dbUser.reviewBanUntil.getTime() > lifetimeThreshold) {
          dbUser.reviewBanUntil = null;
        }
      }
    }

    // 8️⃣ Apply ban logic ONLY if strike increased
    if (strikeChange === +1) {
      const count = dbUser.profanityStrikeCount;

      if (count === 3) {
        dbUser.reviewBanUntil = new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000
        );
      } else if (count >= 8 && count < 20) {
        dbUser.reviewBanUntil = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        );
      } else if (count >= 20) {
        // lifetime ban (100 years)
        dbUser.reviewBanUntil = new Date(
          Date.now() + 100 * 365 * 24 * 60 * 60 * 1000
        );
      }
    }

    await dbUser.save();

    // 9️⃣ Update review
    oldReview.originalComment = rawComment;
    oldReview.displayComment = cleanComment;
    oldReview.rating = rating ?? oldReview.rating;
    oldReview.isFlagged = isBadNow;
    oldReview.moderationStatus = isBadNow ? "pending" : "approved";

    if (categories) {
      oldReview.categories = {
        ...oldReview.categories,
        ...categories
      };
    }

    await oldReview.save();

    return res.status(200).json({
      message: "Review updated successfully",
      review: oldReview,
      strikes: dbUser.profanityStrikeCount
    });

  } catch (error) {
    console.error("UpdateReview Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to update review" });
    }
  }
}; 

// delete Review
/*export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    // 1️⃣ Authorization
    if (review.reviewerId.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // 2️⃣ 24-hour window (Matching your update logic)
    const hoursSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return res.status(400).json({ error: "Delete window closed" });
    }

    // 3️⃣ Strike Restoration (The "Reward" for deleting bad content)
    if (review.isFlagged) {
      const dbUser = await User.findById(userId);
      if (dbUser) {
        // Decrease strike because the offensive content is being removed
        dbUser.profanityStrikeCount = Math.max(0, dbUser.profanityStrikeCount - 1);
        
        // Lift lifetime ban if they've dropped below the threshold
        const lifetimeThreshold = Date.now() + 50 * 365 * 24 * 60 * 60 * 1000;
        if (dbUser.reviewBanUntil?.getTime() > lifetimeThreshold && dbUser.profanityStrikeCount < 20) {
          dbUser.reviewBanUntil = null;
        }
        
        await dbUser.save();
      }
    }

    // 4️⃣ Delete the review
    await Review.findByIdAndDelete(id);

    return res.status(200).json({ message: "Review deleted successfully" });

  } catch (error) {
    console.error("DeleteReview Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}; */

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Allow Postman testing without auth
    const userId = req.user?.id || req.user?._id || req.body?.reviewerId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    // ✅ Robust compare
    if (String(review.reviewerId) !== String(userId)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // 24-hour delete window
    const hoursSinceCreation =
      (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return res.status(400).json({ error: "Delete window closed" });
    }

    // Strike restoration if flagged review removed
    if (review.isFlagged) {
      const dbUser = await User.findById(userId);
      if (dbUser) {
        dbUser.profanityStrikeCount = Math.max(
          0,
          (dbUser.profanityStrikeCount || 0) - 1
        );

        const lifetimeThreshold = Date.now() + 50 * 365 * 24 * 60 * 60 * 1000;
        if (
          dbUser.reviewBanUntil?.getTime() > lifetimeThreshold &&
          dbUser.profanityStrikeCount < 20
        ) {
          dbUser.reviewBanUntil = null;
        }

        await dbUser.save();
      }
    }

    await Review.findByIdAndDelete(id);

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("DeleteReview Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
// getDriverReviews
export const getDriverReviews = async (driverId) => {
  try {
    const results = await Review.aggregate([
      // 1. Filter reviews for the specific driver
      { 
        $match: { driverId: new mongoose.Types.ObjectId(driverId) } 
      },
      
      // 2. Use $facet to run two independent operations simultaneously
      {
        $facet: {
          // Pipeline A: Calculate the average rating
          stats: [
            {
              $group: {
                _id: null,
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 }
              }
            }
          ],
          // Pipeline B: Get the latest 20 comments
          latestReviews: [
            { $sort: { createdAt: -1 } },
            { $limit: 20 },
            {
              $project: {
                comment: 1,
                rating: 1,
                reviewerId: 1,
                createdAt: 1
              }
            }
          ]
        }
      },

      // 3. Clean up the output structure
      {
        $project: {
          averageRating: { $ifNull: [{ $arrayElemAt: ["$stats.averageRating", 0] }, 0] },
          totalReviews: { $ifNull: [{ $arrayElemAt: ["$stats.totalReviews", 0] }, 0] },
          reviews: "$latestReviews"
        }
      }
    ]);

    return results[0] || { averageRating: 0, totalReviews: 0, reviews: [] };
  } catch (error) {
    console.error("Aggregation Error:", error);
    throw error;
  }
};