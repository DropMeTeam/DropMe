import express from "express";
import {
  listStationsAdmin,
  createStation,
  updateStation,
  deleteStation,
} from "./controllers/trainAdminStations.controller.js";
import { requireAuth, requireRole } from "../../middleware/requireAuth.js";

export const trainAdminRouter = express.Router();

// Only train admins (or super admin)
trainAdminRouter.use(requireAuth, requireRole("ADMIN_TRAIN", "SUPER_ADMIN"));

trainAdminRouter.get("/stations", listStationsAdmin);
trainAdminRouter.post("/stations", createStation);
trainAdminRouter.patch("/stations/:id", updateStation);
trainAdminRouter.delete("/stations/:id", deleteStation);
