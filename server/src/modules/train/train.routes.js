import express from "express";
import { listActiveStations } from "./controllers/trainPublicStations.controller.js";
import {
  searchTrains,
  getPassengerTrainDetails,
} from "./controllers/trainPassenger.controller.js";

export const trainRouter = express.Router();

// Public station list
trainRouter.get("/stations", listActiveStations);

// Passenger train search
// Example:
// GET /api/train/search?from=Colombo Fort&to=Kandy&day=Mon
trainRouter.get("/search", searchTrains);

// Passenger train details
// Example:
// GET /api/train/schedules/:id?day=Mon
trainRouter.get("/schedules/:id", getPassengerTrainDetails);