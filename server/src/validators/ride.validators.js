import { z } from "zod";

const GeoPoint = z.object({ lng: z.number(), lat: z.number() });

const Location = z.object({
  point: GeoPoint,
  address: z.string().optional()
});

export const CreateOfferSchema = z.object({
  origin: Location,
  destination: Location,
  pickupTime: z.string().datetime(),
  timeWindowMins: z.number().int().min(0).max(120).optional(),
  seatsTotal: z.number().int().min(1).max(6).optional(),
  routePolyline: z.string().optional()
});

export const CreateRequestSchema = z.object({
  origin: Location,
  destination: Location,
  pickupTime: z.string().datetime(),
  timeWindowMins: z.number().int().min(0).max(120).optional(),
  seatsNeeded: z.number().int().min(1).max(2).optional(),
  mode: z.enum(["POOL", "PRIVATE", "TRANSIT"]).optional()
});
