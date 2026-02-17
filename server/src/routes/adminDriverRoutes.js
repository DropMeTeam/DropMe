import express from "express";
import { requireAuth, allowRoles } from "../middleware/auth.js";
import { listPendingDrivers, approveDriver, rejectDriver } from "../controllers/adminDriverController.js";

const router = express.Router();

router.get("/drivers/pending", requireAuth, allowRoles("private_admin"), listPendingDrivers);
router.post("/drivers/:id/approve", requireAuth, allowRoles("private_admin"), approveDriver);
router.post("/drivers/:id/reject", requireAuth, allowRoles("private_admin"), rejectDriver);

export default router;
