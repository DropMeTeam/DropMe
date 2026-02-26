import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createBooking,
  myBookings,
  offerBookings,
  updateBookingStatus,
  cancelBooking,
  downloadReceipt, // ✅ only this
} from "../controllers/booking.controller.js";

export const bookingsRouter = Router();

// ⚠️ OLD immediate-book endpoint (do NOT call from UI if you use Stripe checkout flow)
bookingsRouter.post(
  "/offers/:id/book",
  requireAuth,
  requireRole("rider", "admin"),
  createBooking
);

bookingsRouter.get("/my", requireAuth, requireRole("rider", "admin"), myBookings);

bookingsRouter.get(
  "/offers/:id",
  requireAuth,
  requireRole("driver", "admin"),
  offerBookings
);

bookingsRouter.patch(
  "/:bookingId/status",
  requireAuth,
  requireRole("driver", "admin"),
  updateBookingStatus
);

// cancel checkout (pending/unpaid)
bookingsRouter.post(
  "/:bookingId/cancel",
  requireAuth,
  requireRole("rider", "admin"),
  cancelBooking
);

// ✅ PDF receipt (ONLY ONE)
bookingsRouter.get(
  "/:bookingId/receipt",
  requireAuth,
  requireRole("rider", "driver", "admin"),
  downloadReceipt
);