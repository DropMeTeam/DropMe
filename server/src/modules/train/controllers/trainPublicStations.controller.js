import { Station } from "../models/Station.js";

/**
 * GET: List only active stations for public users
 * Sorted alphabetically by station name
 */
export async function listActiveStations(req, res) {
  const stations = await Station.find({ isActive: true }).sort({ name: 1 });
  res.json({ stations });
}