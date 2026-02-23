// validators/ride.validators.js
import { z } from "zod";

const GeoPoint = z.object({
  lng: z.coerce.number(),
  lat: z.coerce.number(),
});

const Location = z.object({
  point: GeoPoint,
  address: z.string().optional(),
});

export const CreateOfferSchema = z.object({
  origin: Location,
  destination: Location,

  // ✅ accepts "2026-02-23T21:30" from datetime-local
  pickupTime: z.coerce.date(),

  timeWindowMins: z.coerce.number().int().min(0).max(120).optional(),
  seatsTotal: z.coerce.number().int().min(1).max(6).optional(),
  routePolyline: z.string().optional(),

  // ✅ new optional field
  priceLkr: z.coerce.number().min(0).optional(),
});

export const CreateRequestSchema = z.object({
  origin: Location,
  destination: Location,
  pickupTime: z.coerce.date(),
  timeWindowMins: z.coerce.number().int().min(0).max(120).optional(),
  seatsNeeded: z.coerce.number().int().min(1).max(6).optional(),
  mode: z.enum(["POOL", "PRIVATE", "TRANSIT"]).optional(),
});