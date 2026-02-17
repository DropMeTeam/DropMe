import express from "express";
import {
  listStationsAdmin,
  createStation,
  updateStation,
  deleteStation,
} from "./controllers/trainAdminStations.controller.js";

import {
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "./controllers/trainAdminSchedules.controller.js";

import { requireAuth, requireRole } from "../../middleware/auth.js";

export const trainAdminRouter = express.Router();

// Only train admins (optionally SYSTEM_ADMIN too)
trainAdminRouter.use(requireAuth, requireRole("ADMIN_TRAIN", "SYSTEM_ADMIN"));

/* Stations CRUD */
trainAdminRouter.get("/stations", listStationsAdmin);
trainAdminRouter.post("/stations", createStation);
trainAdminRouter.patch("/stations/:id", updateStation);
trainAdminRouter.delete("/stations/:id", deleteStation);

/* Schedules CRUD */
trainAdminRouter.get("/schedules", listSchedules);
trainAdminRouter.get("/schedules/:id", getSchedule);
trainAdminRouter.post("/schedules", createSchedule);
trainAdminRouter.put("/schedules/:id", updateSchedule);
trainAdminRouter.delete("/schedules/:id", deleteSchedule);
