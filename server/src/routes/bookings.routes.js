import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createBooking,
  myBookings,
  offerBookings,
  updateBookingStatus,
  cancelBooking,
  downloadReceipt,
  markPassengerRideCompleted,
} from "../controllers/booking.controller.js";

export const bookingsRouter = Router();

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

bookingsRouter.patch(
  "/:bookingId/complete-ride",
  requireAuth,
  requireRole("driver", "admin"),
  markPassengerRideCompleted
);

// cancel checkout
bookingsRouter.post(
  "/:bookingId/cancel",
  requireAuth,
  requireRole("rider", "admin"),
  cancelBooking
);

// PDF receipt
bookingsRouter.get(
  "/:bookingId/receipt",
  requireAuth,
  requireRole("rider", "driver", "admin"),
  downloadReceipt
);
