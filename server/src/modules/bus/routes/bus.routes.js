import { Router } from "express";
import {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute
} from "../controllers/busRoute.controller.js";

const router = Router();

// TEMP: no auth until we hook correct middleware
router.get("/routes", getRoutes);
router.post("/routes", createRoute);
router.get("/routes/:id", getRouteById);
router.patch("/routes/:id", updateRoute);
router.delete("/routes/:id", deleteRoute);

export default router;
