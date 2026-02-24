import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  listPendingBusRegistrations,
  approveBus,
  rejectBus
} from "../controllers/busApprovals.controller.js";

export const busApprovalsRouter = Router();

busApprovalsRouter.use(requireAuth, requireRole("ADMIN_BUS"));

busApprovalsRouter.get("/bus-registrations/pending", listPendingBusRegistrations);
busApprovalsRouter.post("/bus-registrations/:id/approve", approveBus);
busApprovalsRouter.post("/bus-registrations/:id/reject", rejectBus);