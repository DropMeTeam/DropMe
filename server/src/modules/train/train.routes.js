import express from "express";
import { listActiveStations } from "./controllers/trainPublicStations.controller.js";
import {
  searchTrains,
  getPassengerTrainDetails,
  listNearestStations,
  searchNearbyTrains,
} from "./controllers/trainPassenger.controller.js";

export const trainRouter = express.Router();

// Public station list
trainRouter.get("/stations", listActiveStations);

// Passenger search by explicit stations
trainRouter.get("/search", searchTrains);

// Passenger search by current location -> nearest valid train stop
trainRouter.get("/nearest-stations", listNearestStations);
trainRouter.get("/search-nearby", searchNearbyTrains);

// Passenger schedule details
trainRouter.get("/schedules/:id", getPassengerTrainDetails);