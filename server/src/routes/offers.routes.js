// routes/offers.routes.js
import { Router } from "express";
import { createOffer, myOffers } from "../controllers/offer.controller.js";
import { searchOffers } from "../controllers/offer.search.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const offersRouter = Router();

// driver publish offer
offersRouter.post("/", requireAuth, requireRole("driver", "admin"), createOffer);
offersRouter.get("/my", requireAuth, requireRole("driver", "admin"), myOffers);

// passenger search offers (public or requireAuth — your call)
offersRouter.get("/search", searchOffers);