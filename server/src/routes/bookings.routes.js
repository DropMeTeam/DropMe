import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createBooking,
  myBookings,
  offerBookings,
  updateBookingStatus,
} from "../controllers/booking.controller.js";

export const bookingsRouter = Router();

bookingsRouter.post("/offers/:id/book", requireAuth, requireRole("rider", "admin"), createBooking);
bookingsRouter.get("/my", requireAuth, requireRole("rider", "admin"), myBookings);
bookingsRouter.get("/offers/:id", requireAuth, requireRole("driver", "admin"), offerBookings);
bookingsRouter.patch("/:bookingId/status", requireAuth, requireRole("driver", "admin"), updateBookingStatus);

bookingsRouter.get("/:bookingId/receipt", requireAuth, async (req, res, next) => {
  try {
    // implement PDF response using pdfkit (I can give full file if you want)
  } catch (e) {
    next(e);
  }
});