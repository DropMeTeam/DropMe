import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createStripeSession,
  verifyStripePayment,
  createTrainStripeSession,
  verifyTrainStripePayment,
} from "../controllers/payments.controller.js";

export const paymentsRouter = Router();

// Existing private vehicle payment routes - keep exactly as they are
paymentsRouter.post(
  "/stripe/session",
  requireAuth,
  requireRole("rider", "admin"),
  createStripeSession
);

paymentsRouter.get(
  "/stripe/verify",
  requireAuth,
  requireRole("rider", "admin"),
  verifyStripePayment
);

// New train payment routes
paymentsRouter.post(
  "/stripe/train/session",
  requireAuth,
  requireRole("rider", "admin"),
  createTrainStripeSession
);

paymentsRouter.get(
  "/stripe/train/verify",
  requireAuth,
  requireRole("rider", "admin"),
  verifyTrainStripePayment
);