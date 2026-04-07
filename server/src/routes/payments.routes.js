import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createStripeSession, verifyStripePayment } from "../controllers/payments.controller.js";

export const paymentsRouter = Router();

paymentsRouter.post("/stripe/session", requireAuth, requireRole("rider", "admin"), createStripeSession);
paymentsRouter.get("/stripe/verify", requireAuth, requireRole("rider", "admin"), verifyStripePayment);