/**
 * Parse allowed browser origins for CORS. Supports comma-separated CLIENT_ORIGIN.
 */
export function getAllowedCorsOrigins() {
  const out = [];

  function push(raw) {
    if (!raw || typeof raw !== "string") return;
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((o) => out.push(o));
  }

  push(process.env.CLIENT_ORIGIN);
  push(process.env.ADMIN_ORIGIN);
  push(process.env.VERCEL_CLIENT_ORIGIN);
  push(process.env.ADDITIONAL_CORS_ORIGINS);

  if (process.env.VERCEL_URL) {
    const v = String(process.env.VERCEL_URL).replace(/^https?:\/\//, "").trim();
    if (v) out.push(`https://${v}`);
  }

  if (out.length === 0) {
    out.push("http://localhost:5173", "http://localhost:5174");
  }

  return [...new Set(out)];
}
