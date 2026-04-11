// server/src/routes/eco.routes.js
import express from "express";
import {
  getEcoLeaderboard,
  getMyEcoStats,
} from "../controllers/eco.controller.js";

import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Public leaderboard
router.get("/leaderboard", getEcoLeaderboard);

// Logged-in user stats
router.get("/me", requireAuth, getMyEcoStats);

export default router;