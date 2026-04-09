import { Station } from "../models/Station.js";

export async function listStationsAdmin(req, res) {
  const stations = await Station.find().sort({ createdAt: -1 });
  res.json({ stations });
}

export async function createStation(req, res) {
  const { name, lat, lng, isActive, address } = req.body || {};

  if (!name || typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ message: "name, lat, lng are required" });
  }

  const station = await Station.create({
  name,
  address: typeof address === "string" ? address : "",
  location: { lat, lng },
  isActive: typeof isActive === "boolean" ? isActive : true,
});

  res.status(201).json({ station });
}

export async function updateStation(req, res) {
  const { id } = req.params;
  const { name, lat, lng, isActive } = req.body || {};

  const patch = {};
  if (typeof name === "string" && name.trim()) patch.name = name.trim();
  if (typeof isActive === "boolean") patch.isActive = isActive;

  if (typeof lat === "number" || typeof lng === "number") {
    patch.location = {};
    if (typeof lat === "number") patch.location.lat = lat;
    if (typeof lng === "number") patch.location.lng = lng;
  }

  const station = await Station.findByIdAndUpdate(id, patch, {
    new: true,
  });

  if (!station) return res.status(404).json({ message: "Station not found" });
  res.json({ station });
}

export async function deleteStation(req, res) {
  const { id } = req.params;
  const station = await Station.findByIdAndDelete(id);
  if (!station) return res.status(404).json({ message: "Station not found" });
  res.json({ ok: true });
}
