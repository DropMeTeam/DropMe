// validators/booking.validators.js
import { z } from "zod";

export const CreateBookingSchema = z.object({
  offerId: z.string().min(10),
  seatsBooked: z.coerce.number().int().min(1).max(6),
});