import { Router } from "express";
import {
  createOffer,
  myOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
} from "../controllers/offer.controller.js";
import { searchOffers } from "../controllers/offer.search.controller.js"; // if you created it
import { requireAuth, requireRole } from "../middleware/auth.js";

export const offersRouter = Router();

offersRouter.post("/", requireAuth, requireRole("driver", "admin"), createOffer);
offersRouter.get("/my", requireAuth, requireRole("driver", "admin"), myOffers);

// passenger search (public)
offersRouter.get("/search", searchOffers);

// ✅ edit/delete lifecycle
offersRouter.get("/:id", requireAuth, requireRole("driver", "admin"), getOfferById);
offersRouter.patch("/:id", requireAuth, requireRole("driver", "admin"), updateOffer);
offersRouter.delete("/:id", requireAuth, requireRole("driver", "admin"), deleteOffer);

offersRouter.get("/public/:id", requireAuth, async (req, res, next) => {
  try {
    const offer = await RideOffer.findById(req.params.id).lean();
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    res.json({ offer });
  } catch (e) {
    next(e);
  }
});