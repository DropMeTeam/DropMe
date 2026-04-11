import express from "express";
import {
  createReview,
  getBookingReview,
  getDriverReviews,
  getMyPendingReviews,
  getMyGivenReviews,
  getReviewById,
  updateReview,
  getDriverPublicProfile,
  getDriverPublicReviews,
  deleteReview
} from "../controllers/review.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/mine/pending", getMyPendingReviews);
router.get("/mine/given", getMyGivenReviews);

router.get("/booking/:bookingId", getBookingReview);
router.get("/driver/:driverId", getDriverReviews);

router.get("/:reviewId", getReviewById);
router.patch("/:reviewId", updateReview);
router.delete("/:reviewId", deleteReview);

router.get("/drivers/:driverId/public-profile", getDriverPublicProfile);
router.get("/drivers/:driverId/public-reviews", getDriverPublicReviews);

router.post("/", createReview);

export default router;