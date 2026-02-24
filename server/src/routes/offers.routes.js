import { Router } from "express";
import {
  createOffer,
  myOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  getOfferPublic, // MUST IMPORT
} from "../controllers/offer.controller.js";
import { searchOffers } from "../controllers/offer.search.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const offersRouter = Router();

offersRouter.post("/", requireAuth, requireRole("driver", "admin"), createOffer);
offersRouter.get("/my", requireAuth, requireRole("driver", "admin"), myOffers);

// passenger search (public)
offersRouter.get("/search", searchOffers);

//  PUBLIC offer MUST be before "/:id"
offersRouter.get("/public/:id", getOfferPublic);

// driver/admin secured
offersRouter.get("/:id", requireAuth, requireRole("driver", "admin"), getOfferById);
offersRouter.patch("/:id", requireAuth, requireRole("driver", "admin"), updateOffer);
offersRouter.delete("/:id", requireAuth, requireRole("driver", "admin"), deleteOffer);