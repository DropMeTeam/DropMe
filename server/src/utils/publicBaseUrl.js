/**
 * Public base URL for links returned to clients (uploads, redirects).
 * Prefer API_BASE_URL; otherwise derive from proxy headers (Render, etc.).
 */
export function publicBaseUrl(req) {
  const configured = process.env.API_BASE_URL;
  if (configured && String(configured).trim()) {
    return String(configured).replace(/\/$/, "");
  }

  const protoHeader = req.headers["x-forwarded-proto"];
  const protoRaw =
    (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) || req.protocol || "http";
  const proto = String(protoRaw).split(",")[0].trim() || "http";

  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host;
  const hostRaw = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  const host = hostRaw ? String(hostRaw).split(",")[0].trim() : "";

  if (host) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  return `http://localhost:${process.env.PORT || 5000}`;
}
