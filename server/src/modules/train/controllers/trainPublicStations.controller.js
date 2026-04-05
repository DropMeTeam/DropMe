import { Station } from "../models/Station.js";

export async function listActiveStations(req, res) {
  try {
    // Support both possible field names for backward compatibility
    const stations = await Station.find({
      $and: [{ isActive: { $ne: false } }, { active: { $ne: false } }],
    }).sort({ name: 1 });
    res.json({ stations });
  } catch (e) {
    res.status(500).json({ message: e.message, stations: [] });
  }
}
