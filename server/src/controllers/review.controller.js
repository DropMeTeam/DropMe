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
    const now = Date.now();

    const pending = bookings
      // not already reviewed
      .filter((b) => !reviewedSet.has(String(b._id)))
      // only still inside the 24-hour review window
      .filter((b) => {
        const rideCompletedAt = b.rideCompletedAt ? new Date(b.rideCompletedAt) : null;
        if (!rideCompletedAt) return false;

        const reviewDeadlineAt = new Date(
          rideCompletedAt.getTime() + 24 * 60 * 60 * 1000
        );

        return reviewDeadlineAt.getTime() > now;
      })
      .map((b) => {
        const snapshot = b.offerSnapshot || {};

        const rideCompletedAt = b.rideCompletedAt ? new Date(b.rideCompletedAt) : null;
        const reviewDeadlineAt = rideCompletedAt
          ? new Date(rideCompletedAt.getTime() + 24 * 60 * 60 * 1000)
          : null;

        return {
          bookingId: String(b._id),
          bookingShortId: String(b._id).slice(-6),

          date: snapshot.pickupTime || b.createdAt || null,
          from: snapshot.originAddress || "-",
          to: snapshot.destinationAddress || "-",

          driverId: b.driverId ? String(b.driverId) : "",
          revieweeRole: "driver",
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

//export async function getMyGivenReviews(req, res, next) {
//  try {
//    const currentUserId = getUserId(req);
//
//    const reviews = await Review.find({ reviewerId: currentUserId })
//      .sort({ createdAt: -1 })
//      .lean();
//
//    const bookingIds = reviews.map((r) => r.bookingId).filter(Boolean);
//    const revieweeIds = reviews.map((r) => r.revieweeId).filter(Boolean);
//
//    const [bookings, reviewees] = await Promise.all([
//      RideBooking.find({ _id: { $in: bookingIds } })
//        .select("offerSnapshot rideCompletedAt createdAt")
//        .lean(),
//
//      User.find({ _id: { $in: revieweeIds } })
//        .select("name role avatarUrl")
//        .lean(),
//    ]);
//
//    const bookingMap = new Map(bookings.map((b) => [String(b._id), b]));
//    const revieweeMap = new Map(reviewees.map((u) => [String(u._id), u]));
//
//    const shaped = reviews.map((review) => {
//      const booking = bookingMap.get(String(review.bookingId));
//      const snapshot = booking?.offerSnapshot || {};
//      const reviewee = revieweeMap.get(String(review.revieweeId));
//
//      const fullComment = review.sanitizedText || review.originalText || "";
//
//      return {
//        _id: String(review._id),
//        bookingId: String(review.bookingId),
//        bookingShortId: String(review.bookingId).slice(-6),
//
//        date: booking?.rideCompletedAt || booking?.createdAt || review.createdAt,
//        from: snapshot.originAddress || "-",
//        to: snapshot.destinationAddress || "-",
//
//        // modal wiring
//        driverId: review.revieweeId ? String(review.revieweeId) : "",
//        revieweeRole: reviewee?.role || "",
//        driverName: reviewee?.name || snapshot.driverName || "-",
//        driverAvatarUrl: reviewee?.avatarUrl || "",
//
//        overallRating: review.overallRating || 0,
//        cleanlinessRating: review.cleanlinessRating || 0,
//        punctualityRating: review.punctualityRating || 0,
//        behaviorRating: review.behaviorRating || 0,
//
//        commentPreview: fullComment
//          ? fullComment.length > 40
//            ? `${fullComment.slice(0, 40)}...`
//            : fullComment
//          : "No comment",
//
//        commentFull: fullComment || "No comment",
//        moderationStatus: review.moderationStatus || "pending",
//        isVisible: Boolean(review.isVisible),
//        createdAt: review.createdAt,
//      };
//    });
//
//    res.json({
//      ok: true,
//      reviews: shaped,
//    });
//  } catch (err) {
//    next(err);
//  }
//}

export async function getMyGivenReviews(req, res, next) {
  try {
    const currentUserId = getUserId(req);

    const reviews = await Review.find({ reviewerId: currentUserId })
      .sort({ createdAt: -1 })
      .lean();

    const bookingIds = reviews.map((r) => r.bookingId).filter(Boolean);
    const revieweeIds = reviews.map((r) => r.revieweeId).filter(Boolean);

    const [bookings, reviewees] = await Promise.all([
      RideBooking.find({ _id: { $in: bookingIds } })
        .select("offerSnapshot rideCompletedAt createdAt")
        .lean(),

      User.find({ _id: { $in: revieweeIds } })
        .select("name role avatarUrl")
        .lean(),
    ]);

    const bookingMap = new Map(bookings.map((b) => [String(b._id), b]));
    const revieweeMap = new Map(reviewees.map((u) => [String(u._id), u]));

    const shaped = reviews.map((review) => {
      const booking = bookingMap.get(String(review.bookingId));
      const snapshot = booking?.offerSnapshot || {};
      const reviewee = revieweeMap.get(String(review.revieweeId));

      const fullComment = review.sanitizedText || review.originalText || "";

      const rideCompletedAt = booking?.rideCompletedAt
        ? new Date(booking.rideCompletedAt)
        : null;

      const reviewDeadlineAt = rideCompletedAt
        ? new Date(rideCompletedAt.getTime() + 24 * 60 * 60 * 1000)
        : null;

      const isEditable =
        reviewDeadlineAt ? Date.now() <= reviewDeadlineAt.getTime() : false;

      return {
        _id: String(review._id),
        bookingId: String(review.bookingId),
        bookingShortId: String(review.bookingId).slice(-6),

        date: booking?.rideCompletedAt || booking?.createdAt || review.createdAt,
        from: snapshot.originAddress || "-",
        to: snapshot.destinationAddress || "-",

        driverId: review.revieweeId ? String(review.revieweeId) : "",
        revieweeRole: reviewee?.role || "",
        driverName: reviewee?.name || snapshot.driverName || "-",
        driverAvatarUrl: reviewee?.avatarUrl || "",

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

        rideCompletedAt,
        reviewDeadlineAt,
        isEditable,

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


// Small helper to keep average values clean like 4.8 instead of 4.833333333
function roundToOne(num = 0) {
  return Math.round(num * 10) / 10;
}

// Small helper to shape review data for frontend cleanly
function mapReview(review) {
  return {
    _id: review._id,
    overallRating: review.overallRating,
    cleanlinessRating: review.cleanlinessRating,
    punctualityRating: review.punctualityRating,
    behaviorRating: review.behaviorRating,
    comment: review.sanitizedText || review.originalText || "",
    createdAt: review.createdAt,
    reviewer: {
      _id: review.reviewerId?._id || null,
      name: review.reviewerId?.name || "Passenger",
      avatarUrl: review.reviewerId?.avatarUrl || "",
    },
  };
}

// GET /api/reviews/drivers/:driverId/public-profile
export async function getDriverPublicProfile(req, res, next) {
  try {
    const { driverId } = req.params;

    // Validate Mongo id early to avoid useless DB work
    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({ message: "Invalid driver id" });
    }

    // Find only approved drivers
    const driver = await User.findOne({
      _id: driverId,
      role: "driver",
      adminStatus: "approved",
    })
      .select("name email avatarUrl contactNo driverRegistration")
      .lean();

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    // Build one reusable review filter
    const reviewFilter = {
      revieweeId: new mongoose.Types.ObjectId(driverId),
      isVisible: true,
      moderationStatus: "approved",
    };

    // Aggregate averages + total count
    const statsRows = await Review.aggregate([
      { $match: reviewFilter },
      {
        $group: {
          _id: "$revieweeId",
          totalReviews: { $sum: 1 },
          overallAvg: { $avg: "$overallRating" },
          cleanlinessAvg: { $avg: "$cleanlinessRating" },
          punctualityAvg: { $avg: "$punctualityRating" },
          behaviorAvg: { $avg: "$behaviorRating" },
        },
      },
    ]);

    const stats = statsRows[0] || {
      totalReviews: 0,
      overallAvg: 0,
      cleanlinessAvg: 0,
      punctualityAvg: 0,
      behaviorAvg: 0,
    };

    // Latest 3 reviews first
    const latestReviews = await Review.find(reviewFilter)
      .sort({ createdAt: -1 }) // latest first
      .limit(3)
      .select(
        "overallRating cleanlinessRating punctualityRating behaviorRating sanitizedText originalText createdAt reviewerId"
      )
      .populate("reviewerId", "name avatarUrl")
      .lean();

    return res.json({
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        avatarUrl: driver.avatarUrl || "",
        contactNo: driver.contactNo || "",
        verified: driver.driverRegistration?.status === "approved",
        driverId: driver.driverRegistration?.driverId || "",
        age: driver.driverRegistration?.age || null,
        address: driver.driverRegistration?.address || "",
        licenseNo: driver.driverRegistration?.licenseNo || "",
      },

      vehicle: {
        type: driver.driverRegistration?.vehicle?.type || "",
        number: driver.driverRegistration?.vehicle?.number || "",
        color: driver.driverRegistration?.vehicle?.color || "",
        seatsTotal: driver.driverRegistration?.vehicle?.seatsTotal || 0,
        photoUrl: driver.driverRegistration?.vehicle?.photoUrl || "",
      },

      stats: {
        totalReviews: stats.totalReviews,
        overallAvg: roundToOne(stats.overallAvg || 0),
        cleanlinessAvg: roundToOne(stats.cleanlinessAvg || 0),
        punctualityAvg: roundToOne(stats.punctualityAvg || 0),
        behaviorAvg: roundToOne(stats.behaviorAvg || 0),
      },

      latestReviews: latestReviews.map(mapReview),

      // Frontend uses this to decide whether to show "See more"
      hasMore: (stats.totalReviews || 0) > latestReviews.length,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/reviews/drivers/:driverId/public-reviews?offset=3&limit=6
export async function getDriverPublicReviews(req, res, next) {
  try {
    const { driverId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({ message: "Invalid driver id" });
    }

    // Make sure this id belongs to a driver
    const driverExists = await User.exists({
      _id: driverId,
      role: "driver",
      adminStatus: "approved",
    });

    if (!driverExists) {
      return res.status(404).json({ message: "Driver not found" });
    }

    // Offset-based pagination works perfectly for "load more"
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const limit = Math.min(12, Math.max(1, Number(req.query.limit) || 6));

    const reviewFilter = {
      revieweeId: new mongoose.Types.ObjectId(driverId),
      isVisible: true,
      moderationStatus: "approved",
    };

    const [reviews, totalReviews] = await Promise.all([
      Review.find(reviewFilter)
        .sort({ createdAt: -1 }) // latest first
        .skip(offset)
        .limit(limit)
        .select(
          "overallRating cleanlinessRating punctualityRating behaviorRating sanitizedText originalText createdAt reviewerId"
        )
        .populate("reviewerId", "name avatarUrl")
        .lean(),

      Review.countDocuments(reviewFilter),
    ]);

    const nextOffset = offset + reviews.length;

    return res.json({
      reviews: reviews.map(mapReview),
      offset,
      nextOffset,
      totalReviews,
      hasMore: nextOffset < totalReviews,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteReview(req, res, next) {
  try {
    const reviewId = String(req.params.reviewId || "").trim();

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new HttpError(400, "Valid reviewId is required");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new HttpError(404, "Review not found");
    }

    const currentUserId = getUserId(req);
    if (String(review.reviewerId) !== currentUserId) {
      throw new HttpError(403, "You are not allowed to delete this review");
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
      throw new HttpError(409, "Review can only be deleted within 24 hours of ride completion");
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({
      ok: true,
      message: "Review deleted successfully",
    });
  } catch (err) {
    next(err);
  }
}