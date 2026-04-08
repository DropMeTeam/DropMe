import express from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.js";
import {
  getBusSeatAvailability,
  createBusBookingCheckout,
  getMyBusBookings,
  getMyBusBookingById,
  cancelMyBusBooking,
} from "../controllers/busBooking.controller.js";

const router = express.Router();

// public seat availability for selected trip segment
router.get("/bookings/availability", getBusSeatAvailability);

// protected passenger booking flow
router.post(
  "/bookings/checkout",
  requireAuth,
  requireRole("rider"),
  createBusBookingCheckout
);

router.get(
  "/bookings/mine",
  requireAuth,
  requireRole("rider"),
  getMyBusBookings
);

router.get(
  "/bookings/:id",
  requireAuth,
  requireRole("rider"),
  getMyBusBookingById
);

router.patch(
  "/bookings/:id/cancel",
  requireAuth,
  requireRole("rider"),
  cancelMyBusBooking
);

export default router;