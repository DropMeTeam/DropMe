import { Router } from "express";

import { requireAuth, requireRole } from "../../../middleware/requireAuth.js";

import {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute
} from "../controllers/busRoute.controller.js";

const router = Router();

// List routes (auth for now)
router.get("/routes", requireAuth, getRoutes);

// Bus admin CRUD
router.post("/routes", requireAuth, requireRole("admin", "bus_admin"), createRoute);
router.get("/routes/:id", requireAuth, requireRole("admin", "bus_admin"), getRouteById);
router.patch("/routes/:id", requireAuth, requireRole("admin", "bus_admin"), updateRoute);
router.delete("/routes/:id", requireAuth, requireRole("admin", "bus_admin"), deleteRoute);

export default router;
