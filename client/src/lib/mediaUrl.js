import { api } from "./api";

function apiOrigin() {
  const base = api?.defaults?.baseURL || "";
  if (typeof base === "string" && /^https?:\/\//i.test(base)) {
    return base.replace(/\/$/, "");
  }
  return (
    import.meta.env.VITE_API_ORIGIN ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_BASE ||
    "http://localhost:5000"
  ).replace(/\/$/, "");
}

/**
 * Turn stored upload paths or legacy API hosts into a URL that loads from the current API host.
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  const origin = apiOrigin();

  if (/^https?:\/\//i.test(trimmed)) {
    const uploadsIdx = trimmed.indexOf("/uploads/");
    if (uploadsIdx !== -1) {
      return `${origin}${trimmed.slice(uploadsIdx)}`;
    }
    return trimmed;
  }

  return `${origin}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}
