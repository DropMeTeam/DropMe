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
  markTrainBookingPaid,
} from "./controllers/trainBooking.controller.js";

/**
 * IMPORTANT:
 * Replace this import path with YOUR real auth middleware path.
 * Use the same middleware you already use for protected user routes.
 */
import { requireAuth } from "../../middleware/requireAuth.js";

export const trainRouter = express.Router();

// public train endpoints
trainRouter.get("/stations", listActiveStations);
trainRouter.get("/search", searchTrains);
trainRouter.get("/nearest-stations", listNearestStations);
trainRouter.get("/search-nearby", searchNearbyTrains);
trainRouter.get("/schedules/:id", getPassengerTrainDetails);

// protected booking endpoints
trainRouter.post("/bookings/checkout", requireAuth, createTrainBookingCheckout);
trainRouter.get("/bookings/mine", requireAuth, listMyTrainBookings);
trainRouter.get("/bookings/:id", requireAuth, getMyTrainBookingById);
trainRouter.patch("/bookings/:id/cancel", requireAuth, cancelMyTrainBooking);

