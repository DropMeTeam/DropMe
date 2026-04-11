import { Router } from "express";

import {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute
} from "../controllers/busRoute.controller.js";

import scheduleRouter from "./bus.schedules.routes.js";
import bookingRouter from "./bus.bookings.routes.js";

const router = Router();

// TEMP: no auth until we hook correct middleware
router.get("/routes", getRoutes);
router.post("/routes", createRoute);
router.get("/routes/:id", getRouteById);
router.patch("/routes/:id", updateRoute);
router.delete("/routes/:id", deleteRoute);

router.use(scheduleRouter);
router.use(bookingRouter);

export default router;