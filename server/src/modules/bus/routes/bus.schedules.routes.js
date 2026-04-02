import { Router } from "express";
import {
  getBusesForRoute,
  getSchedulesForRoute,
  upsertSchedule,
  deleteSchedule,
} from "../controllers/busSchedule.controller.js";

const router = Router();

 
router.get("/routes/:routeId/buses", getBusesForRoute);
router.get("/routes/:routeId/schedules", getSchedulesForRoute);
router.post("/routes/:routeId/schedules", upsertSchedule);
router.delete("/schedules/:id", deleteSchedule);



export default router;