import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listPendingAdmins, approveAdmin, denyAdmin } from "../controllers/adminApprovals.controller.js";

export const adminRouter = Router();

// SYSTEM_ADMIN approves requests
adminRouter.get("/approvals", requireAuth, requireRole("SYSTEM_ADMIN"), listPendingAdmins);
adminRouter.post("/approvals/:id/approve", requireAuth, requireRole("SYSTEM_ADMIN"), approveAdmin);
adminRouter.post("/approvals/:id/deny", requireAuth, requireRole("SYSTEM_ADMIN"), denyAdmin);
