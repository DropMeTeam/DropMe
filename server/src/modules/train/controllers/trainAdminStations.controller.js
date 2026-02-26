import { Station } from "../models/Station.js";

/**
 * GET: List all stations for admin
 * Sorted by newest first
 */
export async function listStationsAdmin(req, res) {
  const stations = await Station.find().sort({ createdAt: -1 });
  res.json({ stations });
}

/**
 * POST: Create a new station
 *
 * Required:
 * - name
 * - lat
 * - lng
 *
 * Optional:
 * - isActive
 * - address
 */
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

/**
 * PATCH/PUT: Update an existing station
 *
 * Can update:
 * - name
 * - lat
 * - lng
 * - isActive
 */
export async function updateStation(req, res) {
  const { id } = req.params;
  const { name, lat, lng, isActive } = req.body || {};

  const patch = {};

  // Update station name if valid string
  if (typeof name === "string" && name.trim()) {
    patch.name = name.trim();
  }

  // Update active status if boolean
  if (typeof isActive === "boolean") {
    patch.isActive = isActive;
  }

  // Update location partially or fully
  if (typeof lat === "number" || typeof lng === "number") {
    patch.location = {};

    if (typeof lat === "number") patch.location.lat = lat;
    if (typeof lng === "number") patch.location.lng = lng;
  }

  const station = await Station.findByIdAndUpdate(id, patch, {
    new: true,
  });

  if (!station) {
    return res.status(404).json({ message: "Station not found" });
  }

  res.json({ station });
}

/**
 * DELETE: Remove a station by ID
 */
export async function deleteStation(req, res) {
  const { id } = req.params;

  const station = await Station.findByIdAndDelete(id);

  if (!station) {
    return res.status(404).json({ message: "Station not found" });
  }

  res.json({ ok: true });
}