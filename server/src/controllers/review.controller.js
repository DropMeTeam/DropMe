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

    const pending = bookings
      .filter((b) => !reviewedSet.has(String(b._id)))
      .map((b) => {
        const snapshot = b.offerSnapshot || {};

        const rideCompletedAt = b.rideCompletedAt ? new Date(b.rideCompletedAt) : null;
        const reviewDeadlineAt = rideCompletedAt
          ? new Date(rideCompletedAt.getTime() + 24 * 60 * 60 * 1000)
          : null;

        return {
          bookingId: String(b._id),
          bookingShortId: String(b._id).slice(-6),

          // for your table
          date: snapshot.pickupTime || b.createdAt || null,
          from: snapshot.originAddress || "-",
          to: snapshot.destinationAddress || "-",
          driverName: snapshot.driverName || "-",

          rideCompletedAt,
          reviewDeadlineAt,
        };
      });

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

export async function getMyGivenReviews(req, res, next) {
  try {
    const currentUserId = getUserId(req);

    const reviews = await Review.find({ reviewerId: currentUserId })
      .sort({ createdAt: -1 })
      .lean();

    const bookingIds = reviews.map((r) => r.bookingId).filter(Boolean);

    const bookings = await RideBooking.find({ _id: { $in: bookingIds } })
      .select("offerSnapshot rideCompletedAt createdAt")
      .lean();

    const bookingMap = new Map(
      bookings.map((b) => [String(b._id), b])
    );

    const shaped = reviews.map((review) => {
      const booking = bookingMap.get(String(review.bookingId));
      const snapshot = booking?.offerSnapshot || {};

      const fullComment =
        review.sanitizedText ||
        review.originalText ||
        "";

      return {
        _id: String(review._id),
        bookingId: String(review.bookingId),
        bookingShortId: String(review.bookingId).slice(-6),
        date: booking?.rideCompletedAt || booking?.createdAt || review.createdAt,
        from: snapshot.originAddress || "-",
        to: snapshot.destinationAddress || "-",
        driverName: snapshot.driverName || "-",
        overallRating: review.overallRating || 0,
        cleanlinessRating: review.cleanlinessRating || 0,
        punctualityRating: review.punctualityRating || 0,
        behaviorRating: review.behaviorRating || 0,
        commentPreview: fullComment
          ? fullComment.length > 40
            ? `${fullComment.slice(0, 40)}...`
            : fullComment
          : "No comment",
        commentFull: fullComment || "No comment",
        moderationStatus: review.moderationStatus || "pending",
        isVisible: Boolean(review.isVisible),
        createdAt: review.createdAt,
      };
    });

    res.json({
      ok: true,
      reviews: shaped,
    });
  } catch (err) {
    next(err);
  }
}

export async function getReviewById(req, res, next) {
  try {
    const reviewId = String(req.params.reviewId || "").trim();

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new HttpError(400, "Valid reviewId is required");
    }

    const review = await Review.findById(reviewId).lean();
    if (!review) {
      throw new HttpError(404, "Review not found");
    }

    const currentUserId = getUserId(req);

    if (String(review.reviewerId) !== currentUserId) {
      throw new HttpError(403, "You are not allowed to view this review");
    }

    const booking = await RideBooking.findById(review.bookingId)
      .select("offerSnapshot rideCompletedAt createdAt")
      .lean();

    const snapshot = booking?.offerSnapshot || {};
    const rideCompletedAt = booking?.rideCompletedAt ? new Date(booking.rideCompletedAt) : null;
    const reviewDeadlineAt = rideCompletedAt
      ? new Date(rideCompletedAt.getTime() + 24 * 60 * 60 * 1000)
      : null;

    const isEditable =
      reviewDeadlineAt ? Date.now() <= reviewDeadlineAt.getTime() : false;

    res.json({
      ok: true,
      review: {
        _id: String(review._id),
        bookingId: String(review.bookingId),
        bookingShortId: String(review.bookingId).slice(-6),
        date: booking?.rideCompletedAt || booking?.createdAt || review.createdAt,
        from: snapshot.originAddress || "-",
        to: snapshot.destinationAddress || "-",
        driverName: snapshot.driverName || "-",
        overallRating: review.overallRating || 0,
        cleanlinessRating: review.cleanlinessRating || 0,
        punctualityRating: review.punctualityRating || 0,
        behaviorRating: review.behaviorRating || 0,
        originalText: review.originalText || "",
        sanitizedText: review.sanitizedText || "",
        moderationStatus: review.moderationStatus || "pending",
        isVisible: Boolean(review.isVisible),
        rideCompletedAt,
        reviewDeadlineAt,
        isEditable,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateReview(req, res, next) {
  try {
    const reviewId = String(req.params.reviewId || "").trim();
    const reviewText = String(req.body?.reviewText || "").trim();

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new HttpError(400, "Valid reviewId is required");
    }

    const overallRating = normalizeRating(req.body?.overallRating, "overallRating");
    const cleanlinessRating = normalizeRating(req.body?.cleanlinessRating, "cleanlinessRating");
    const punctualityRating = normalizeRating(req.body?.punctualityRating, "punctualityRating");
    const behaviorRating = normalizeRating(req.body?.behaviorRating, "behaviorRating");

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new HttpError(404, "Review not found");
    }

    const currentUserId = getUserId(req);

    if (String(review.reviewerId) !== currentUserId) {
      throw new HttpError(403, "You are not allowed to update this review");
    }

    const booking = await RideBooking.findById(review.bookingId);
    if (!booking) {
      throw new HttpError(404, "Related booking not found");
    }

    const rideCompletedAt = booking.rideCompletedAt ? new Date(booking.rideCompletedAt) : null;
    const reviewDeadlineAt = rideCompletedAt
      ? new Date(rideCompletedAt.getTime() + 24 * 60 * 60 * 1000)
      : null;

    if (!reviewDeadlineAt || Date.now() > reviewDeadlineAt.getTime()) {
      throw new HttpError(409, "Review can only be updated within 24 hours of ride completion");
    }

    const moderation = await analyzeReviewText(reviewText);

    review.overallRating = overallRating;
    review.cleanlinessRating = cleanlinessRating;
    review.punctualityRating = punctualityRating;
    review.behaviorRating = behaviorRating;
    review.originalText = reviewText;
    review.sanitizedText = moderation.sanitizedText;
    review.moderationStatus = moderation.suggestedStatus;
    review.isVisible = moderation.suggestedStatus === "approved";
    review.profanityLevel = moderation.profanityLevel;
    review.geminiFlagged = moderation.flagged;
    review.geminiConfidence = moderation.confidence;
    review.geminiReason = moderation.reason;
    review.moderatedBy = null;
    review.moderatedAt = null;
    review.moderationReason = "";

    await review.save();

    res.json({
      ok: true,
      message: review.isVisible
        ? "Review updated successfully"
        : "Review updated and sent for moderation",
      review,
    });
  } catch (err) {
    next(err);
  }
}