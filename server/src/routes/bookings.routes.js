// routes/bookings.routes.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createBooking, myBookings } from "../controllers/booking.controller.js";

export const bookingsRouter = Router();

bookingsRouter.post("/", requireAuth, createBooking);
bookingsRouter.get("/my", requireAuth, myBookings);