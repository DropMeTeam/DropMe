import express from "express";
import { listActiveStations } from "./controllers/trainPublicStations.controller.js";

export const trainRouter = express.Router();

trainRouter.get("/stations", listActiveStations);
