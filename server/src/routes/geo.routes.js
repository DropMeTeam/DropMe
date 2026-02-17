import { Router } from "express";

const router = Router();

router.get("/nominatim/search", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 3) return res.status(400).json({ message: "Query too short" });

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "6");
    url.searchParams.set("addressdetails", "1");

    const r = await fetch(url.toString(), {
      headers: {
        "User-Agent": "DropMe/1.0 (admin module)",
        "Accept": "application/json"
      }
    });

    if (!r.ok) {
      return res.status(502).json({ message: "Nominatim upstream error" });
    }

    const data = await r.json();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
