import express from "express";
import { listActiveStations } from "./controllers/trainPublicStations.controller.js";
import {
  searchTrains,
  getPassengerTrainDetails,
  listNearestStations,
  searchNearbyTrains,
} from "./controllers/trainPassenger.controller.js";
import {
  createTrainBookingCheckout,
  listMyTrainBookings,
  getMyTrainBookingById,
  cancelMyTrainBooking,
} from "./controllers/trainBooking.controller.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";

export const trainRouter = express.Router();

// public train endpoints
trainRouter.get("/stations", listActiveStations);
trainRouter.get("/search", searchTrains);
trainRouter.get("/nearest-stations", listNearestStations);
trainRouter.get("/search-nearby", searchNearbyTrains);
trainRouter.get("/schedules/:id", getPassengerTrainDetails);

// protected rider booking endpoints
trainRouter.post(
  "/bookings/checkout",
  requireAuth,
  requireRole("rider"),
  createTrainBookingCheckout
);

trainRouter.get(
  "/bookings/mine",
  requireAuth,
  requireRole("rider"),
  listMyTrainBookings
);

trainRouter.get(
  "/bookings/:id",
  requireAuth,
  requireRole("rider"),
  getMyTrainBookingById
);

trainRouter.patch(
  "/bookings/:id/cancel",
  requireAuth,
  requireRole("rider"),
  cancelMyTrainBooking
);