import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listPendingDrivers, approveDriver, rejectDriver } from "../controllers/driverApprovals.controller.js";

export const driverApprovalsRouter = Router();

// ✅ only PRIVATE admin can approve drivers
driverApprovalsRouter.use(requireAuth, requireRole("ADMIN_PRIVATE"));

driverApprovalsRouter.get("/drivers/pending", listPendingDrivers);
driverApprovalsRouter.post("/drivers/:id/approve", approveDriver);
driverApprovalsRouter.post("/drivers/:id/reject", rejectDriver);
