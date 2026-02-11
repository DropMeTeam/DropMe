import { Router } from "express";
import { findMatches, accept } from "../controllers/match.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const matchesRouter = Router();

matchesRouter.post("/find", requireAuth, findMatches);
matchesRouter.post("/:matchId/accept", requireAuth, accept);
