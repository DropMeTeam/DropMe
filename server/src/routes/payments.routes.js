import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createStripeSession,
  verifyStripePayment,
  createTrainStripeSession,
  verifyTrainStripePayment,
} from "../controllers/payments.controller.js";

export const paymentsRouter = Router();

// ride payments - rider only
paymentsRouter.post(
  "/stripe/session",
  requireAuth,
  requireRole("rider"),
  createStripeSession
);

paymentsRouter.get(
  "/stripe/verify",
  requireAuth,
  requireRole("rider"),
  verifyStripePayment
);

// train payments - rider only
paymentsRouter.post(
  "/stripe/train/session",
  requireAuth,
  requireRole("rider"),
  createTrainStripeSession
);

paymentsRouter.get(
  "/stripe/train/verify",
  requireAuth,
  requireRole("rider"),
  verifyTrainStripePayment
);