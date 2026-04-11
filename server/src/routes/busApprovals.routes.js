import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  listPendingBusRegistrations,
  listApprovedBusRegistrations,
  approveBus,
  rejectBus,
} from "../controllers/busApprovals.controller.js";

export const busApprovalsRouter = Router();

busApprovalsRouter.get(
  "/bus-registrations/pending",
  requireAuth,
  requireRole("ADMIN_BUS"),
  listPendingBusRegistrations
);

busApprovalsRouter.get(
  "/bus-registrations/approved",
  requireAuth,
  requireRole("ADMIN_BUS"),
  listApprovedBusRegistrations
);

busApprovalsRouter.post(
  "/bus-registrations/:id/approve",
  requireAuth,
  requireRole("ADMIN_BUS"),
  approveBus
);

busApprovalsRouter.post(
  "/bus-registrations/:id/reject",
  requireAuth,
  requireRole("ADMIN_BUS"),
  rejectBus
);