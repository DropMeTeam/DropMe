import { Router } from "express";

const router = Router();

async function nominatimSearch(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(Number(req.query.limit || 6), 20);

    // ✅ Avoid frontend showing "error" while typing
    if (q.length < 3) return res.json({ results: [] });

    const countryCodes = req.query.countryCodes ? String(req.query.countryCodes) : null;
    const viewbox = req.query.viewbox ? String(req.query.viewbox) : null;
    const bounded = req.query.bounded === "1" || req.query.bounded === "true";

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("addressdetails", "0");

    if (countryCodes) url.searchParams.set("countrycodes", countryCodes);
    if (viewbox) url.searchParams.set("viewbox", viewbox);
    if (bounded) url.searchParams.set("bounded", "1");

    const r = await fetch(url.toString(), {
      headers: {
        "User-Agent": "DropMe/1.0 (geo proxy)",
        "Accept": "application/json",
        "Accept-Language": "en",
      },
    });

    if (!r.ok) {
      return res.status(502).json({ message: "Nominatim upstream error" });
    }

    const data = await r.json();

    // ✅ Match what PlaceSearch expects: res.data.results[]
    const results = Array.isArray(data)
      ? data.map((d) => ({
          label: d.display_name,
          lat: Number(d.lat),
          lng: Number(d.lon),
        }))
      : [];

    return res.json({ results });
  } catch (err) {
    next(err);
  }
}

// ✅ New endpoint used by your frontend
router.get("/search", nominatimSearch);

// ✅ Keep old endpoint too (optional, but safe)
router.get("/nominatim/search", nominatimSearch);

export default router;