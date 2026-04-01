import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createStripeSession,
  verifyStripePayment,
  createTrainStripeSession,
  verifyTrainStripePayment,
} from "../controllers/payments.controller.js";

export const paymentsRouter = Router();

// ride payments
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

// train payments
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