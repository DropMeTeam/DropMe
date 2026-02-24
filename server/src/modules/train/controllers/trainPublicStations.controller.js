import { Station } from "../models/Station.js";

export async function listActiveStations(req, res) {
  const stations = await Station.find({ isActive: true }).sort({ name: 1 });
  res.json({ stations });
}
