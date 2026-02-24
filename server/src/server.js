// backend/server.js (PATCH EXAMPLE)
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { ZodError } from "zod";

import { geoRouter } from "./routes/geo.routes.js"; // ✅ NEW

const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: [CLIENT_ORIGIN],
    credentials: true,
  })
);

app.use(express.json());

// ✅ Fix NotSameOrigin: allow images/resources to be loaded cross-origin
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ✅ uploads folder serve (with CORP header)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", CLIENT_ORIGIN);
    next();
  },
  express.static(path.join(__dirname, "../uploads"))
);

// ✅ NEW: mount geo proxy
app.use("/api/geo", geoRouter);

// ... your other routes here ...
// app.use("/api/offers", offersRouter);
// app.use("/api/requests", requestsRouter);
// etc...

// ✅ IMPORTANT: make Zod errors return 400 (not 500)
app.use((err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: "Validation error", issues: err.issues });
  }
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

export default app;