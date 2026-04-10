import mongoose from "mongoose";
import { Review } from "../models/Review.js";
import { RideBooking } from "../models/RideBooking.js";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { analyzeReviewText } from "../services/geminiModeration.service.js";

function getUserId(req) {
  return String(req.user?.sub || "");
}

function normalizeRating(value, fieldName) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 1 || num > 5) {
    throw new HttpError(400, `${fieldName} must be between 1 and 5`);
  }
  return num;
}

export async function createReview(req, res, next) {
  try {
    const bookingId = String(req.body?.bookingId || "").trim();
    const reviewText = String(req.body?.reviewText || "").trim();

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new HttpError(400, "Valid bookingId is required");
    }

    const overallRating = normalizeRating(req.body?.overallRating, "overallRating");
    const cleanlinessRating = normalizeRating(req.body?.cleanlinessRating, "cleanlinessRating");
    const punctualityRating = normalizeRating(req.body?.punctualityRating, "punctualityRating");
    const behaviorRating = normalizeRating(req.body?.behaviorRating, "behaviorRating");

    const booking = await RideBooking.findById(bookingId);
    if (!booking) throw new HttpError(404, "Booking not found");

    const currentUserId = getUserId(req);

    if (String(booking.riderId) !== currentUserId) {
      throw new HttpError(403, "Only the passenger of this booking can submit a review");
    }

    if (!booking.rideCompleted) {
      throw new HttpError(409, "Review allowed only after ride completion");
    }

    if (booking.paymentStatus !== "paid") {
      throw new HttpError(409, "Only paid rides can be reviewed");
    }

    const existing = await Review.findOne({
      bookingId: booking._id,
      reviewerId: booking.riderId,
    }).lean();

    if (existing) {
      throw new HttpError(409, "You already reviewed this booking");
    }

    const user = await User.findById(booking.riderId).select("moderation");
    const restrictionUntil = user?.moderation?.reviewRestrictionUntil;

    if (restrictionUntil && new Date(restrictionUntil) > new Date()) {
      throw new HttpError(403, "Your review access is temporarily restricted");
    }

    const moderation = await analyzeReviewText(reviewText);

    const review = await Review.create({
      bookingId: booking._id,
      offerId: booking.offerId,
      reviewerId: booking.riderId,
      revieweeId: booking.driverId,

      overallRating,
      cleanlinessRating,
      punctualityRating,
      behaviorRating,

      originalText: reviewText,
      sanitizedText: moderation.sanitizedText,

      moderationStatus: moderation.suggestedStatus,
      isVisible: moderation.suggestedStatus === "approved",

      profanityLevel: moderation.profanityLevel,
      geminiFlagged: moderation.flagged,
      geminiConfidence: moderation.confidence,
      geminiReason: moderation.reason,
    });

    if (
      moderation.strikeRecommended &&
      moderation.confidence >= 0.85 &&
      moderation.profanityLevel === "severe"
    ) {
      const nextStrikeCount = Number(user?.moderation?.strikeCount || 0) + 1;

      const update = {
        $inc: { "moderation.strikeCount": 1 },
        $set: {
          "moderation.lastStrikeAt": new Date(),
        },
      };

      if (nextStrikeCount >= 3) {
        update.$set["moderation.reviewRestrictionUntil"] = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        );
      }

      await User.findByIdAndUpdate(booking.riderId, update);
    }

    res.status(201).json({
      ok: true,
      message: review.isVisible
        ? "Review submitted successfully"
        : "Review submitted and sent for moderation",
      review,
    });
  } catch (err) {
    next(err);
  }
}

export async function getBookingReview(req, res, next) {
  try {
    const bookingId = String(req.params.bookingId || "").trim();

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new HttpError(400, "Valid bookingId is required");
    }

    const review = await Review.findOne({ bookingId }).lean();
    res.json({ ok: true, review });
  } catch (err) {
    next(err);
  }
}

export async function getMyPendingReviews(req, res, next) {
  try {
    const currentUserId = getUserId(req);

    const bookings = await RideBooking.find({
      riderId: currentUserId,
      rideCompleted: true,
      paymentStatus: "paid",
      status: "confirmed",
    })
      .sort({ rideCompletedAt: -1, updatedAt: -1 })
      .lean();

    const bookingIds = bookings.map((b) => b._id);

    const reviews = await Review.find({
      bookingId: { $in: bookingIds },
      reviewerId: currentUserId,
    })
      .select("bookingId")
      .lean();

    const reviewedSet = new Set(reviews.map((r) => String(r.bookingId)));

    const pending = bookings.filter((b) => !reviewedSet.has(String(b._id)));

    res.json({ ok: true, pending });
  } catch (err) {
    next(err);
  }
}

export async function getDriverReviews(req, res, next) {
  try {
    const driverId = String(req.params.driverId || "").trim();

    if (!driverId || !mongoose.Types.ObjectId.isValid(driverId)) {
      throw new HttpError(400, "Valid driverId is required");
    }

    const reviews = await Review.find({
      revieweeId: driverId,
      moderationStatus: "approved",
      isVisible: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    const total = reviews.length;
    const averageOverall =
      total > 0
        ? Number(
            (
              reviews.reduce((sum, item) => sum + Number(item.overallRating || 0), 0) / total
            ).toFixed(1)
          )
        : 0;

    res.json({
      ok: true,
      total,
      averageOverall,
      reviews,
    });
  } catch (err) {
    next(err);
  }
}