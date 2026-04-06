import { Router } from "express";
import {
  createOffer,
  myOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
} from "../controllers/offer.controller.js";
import { searchOffers } from "../controllers/offer.search.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { RideOffer } from "../models/RideOffer.js"; 


export const offersRouter = Router();

offersRouter.post("/", requireAuth, requireRole("driver", "admin"), createOffer);
offersRouter.get("/my", requireAuth, requireRole("driver", "admin"), myOffers);


offersRouter.get("/search", searchOffers);


offersRouter.get("/public/:id", requireAuth, async (req, res, next) => {
  try {
    const offer = await RideOffer.findById(req.params.id).lean();
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    res.json({ offer });
  } catch (e) {
    next(e);
  }
});

// edit/delete lifecycle 
offersRouter.get("/:id", requireAuth, requireRole("driver", "admin"), getOfferById);
offersRouter.patch("/:id", requireAuth, requireRole("driver", "admin"), updateOffer);
offersRouter.delete("/:id", requireAuth, requireRole("driver", "admin"), deleteOffer);