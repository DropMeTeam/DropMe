import axios from "axios";

const base = (import.meta.env.VITE_API_BASE || "http://localhost:5000").replace(/\/$/, "");

// default export (keep old code working)
const api = axios.create({
  baseURL: base,
  withCredentials: true,
});

// named export for clean /api calls
export const apiV1 = axios.create({
  baseURL: `${base}/api`,
  withCredentials: true,
});

export default api;
