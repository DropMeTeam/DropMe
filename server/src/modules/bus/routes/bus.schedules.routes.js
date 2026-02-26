import { Router } from "express";
import {
  getBusesForRoute,
  getSchedulesForRoute,
  upsertSchedule,
  deleteSchedule,
  // getOwnerSchedules, // ⚠️ keep off if you removed auth (it needs req.user)
} from "../controllers/busSchedule.controller.js";

const router = Router();

// ✅ PUBLIC (no auth)
router.get("/routes/:routeId/buses", getBusesForRoute);
router.get("/routes/:routeId/schedules", getSchedulesForRoute);
router.post("/routes/:routeId/schedules", upsertSchedule);
router.delete("/schedules/:id", deleteSchedule);

// ⚠️ If you keep this, it will fail because req.user is not set.
// router.get("/bus-owner/schedules", getOwnerSchedules);

export default router;