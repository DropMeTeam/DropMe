import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  listPendingDrivers,
  approveDriver,
  rejectDriver,
} from "../controllers/driverApprovals.controller.js";

export const driverApprovalsRouter = Router();

driverApprovalsRouter.get(
  "/drivers/pending",
  requireAuth,
  requireRole("ADMIN_PRIVATE"),
  listPendingDrivers
);

driverApprovalsRouter.post(
  "/drivers/:id/approve",
  requireAuth,
  requireRole("ADMIN_PRIVATE"),
  approveDriver
);

driverApprovalsRouter.post(
  "/drivers/:id/reject",
  requireAuth,
  requireRole("ADMIN_PRIVATE"),
  rejectDriver
);