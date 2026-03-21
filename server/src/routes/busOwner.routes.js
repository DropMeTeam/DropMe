import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createBus, listMyBuses } from "../controllers/busOwner.controller.js";

export const busOwnerRouter = Router();

busOwnerRouter.use(requireAuth, requireRole("BUS_OWNER"));

busOwnerRouter.get("/buses", listMyBuses);
busOwnerRouter.post("/buses", createBus);