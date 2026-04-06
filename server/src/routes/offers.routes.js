import { Router } from "express";
import { createOffer, myOffers } from "../controllers/offer.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const offersRouter = Router();

offersRouter.post("/", requireAuth, requireRole("driver", "admin"), createOffer);
offersRouter.get("/my", requireAuth, requireRole("driver", "admin"), myOffers);
