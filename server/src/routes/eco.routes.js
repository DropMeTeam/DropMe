// server/src/routes/eco.routes.js
import express from "express";
import {
  getEcoLeaderboard,
  getMyEcoStats,
  syncMyEcoStats,
    syncTrainCarbonByBookingId,
    syncBusCarbonByBookingId,
    syncRideCarbonByBookingId,
} from "../controllers/eco.controller.js";

import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Public leaderboard
router.get("/leaderboard", getEcoLeaderboard);

// Logged-in user stats
router.get("/me", requireAuth, getMyEcoStats);

router.post("/sync/me", requireAuth, syncMyEcoStats);
router.post("/sync/train/:bookingId", requireAuth, syncTrainCarbonByBookingId);
router.post("/sync/bus/:bookingId", requireAuth, syncBusCarbonByBookingId);
router.post("/sync/ride/:bookingId", requireAuth, syncRideCarbonByBookingId);


export default router;