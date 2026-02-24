// backend/routes/geo.routes.js
import { Router } from "express";

export const geoRouter = Router();

// Nominatim usage policy prefers a User-Agent
const USER_AGENT = "DropMeLocalDev/1.0 (localhost)";

geoRouter.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ results: [] });

    const url =
      "https://nominatim.openstreetmap.org/search?" +
      new URLSearchParams({
        q,
        format: "json",
        addressdetails: "1",
        limit: "6",
        countrycodes: "lk",
        viewbox: "79.35,9.95,81.90,5.85",
      }).toString();

    const r = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en",
      },
    });

    if (!r.ok) return res.status(502).json({ message: "Geocoding provider error" });

    const data = await r.json();

    const results = (data || []).map((x) => ({
      label: x.display_name,
      lat: Number(x.lat),
      lng: Number(x.lon),
    }));

    res.json({ results });
  } catch (e) {
    res.status(500).json({ message: "Geo search failed" });
  }
});

geoRouter.get("/reverse", async (req, res) => {
  try {
    const lat = String(req.query.lat || "");
    const lng = String(req.query.lng || "");
    if (!lat || !lng) return res.status(400).json({ message: "lat/lng required" });

    const url =
      "https://nominatim.openstreetmap.org/reverse?" +
      new URLSearchParams({
        format: "json",
        lat,
        lon: lng,
        zoom: "18",
        addressdetails: "1",
      }).toString();

    const r = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en",
      },
    });

    if (!r.ok) return res.status(502).json({ message: "Reverse geocode failed" });

    const data = await r.json();
    res.json({ label: data?.display_name || `${lat}, ${lng}` });
  } catch (e) {
    res.status(500).json({ message: "Geo reverse failed" });
  }
});