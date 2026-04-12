import express, { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createStripeSession,
  verifyStripePayment,
  createTrainStripeSession,
  verifyTrainStripePayment,
  createBusStripeSession,
  verifyBusStripePayment,
  stripeWebhook,
} from "../controllers/payments.controller.js";

export const paymentsRouter = Router();

/**
 * Stripe webhook
 * Must stay public
 * Must use raw body
 */
paymentsRouter.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// Private ride payment routes
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

// Train payment routes
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

// Bus payment routes
paymentsRouter.post(
  "/stripe/bus/session",
  requireAuth,
  requireRole("rider", "admin"),
  createBusStripeSession
);

paymentsRouter.get(
  "/stripe/bus/verify",
  requireAuth,
  requireRole("rider", "admin"),
  verifyBusStripePayment
);