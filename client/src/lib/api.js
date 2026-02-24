import axios from "axios";

const rawBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const base = rawBase.replace(/\/$/, ""); // remove trailing slash

// ✅ baseURL = http://localhost:5000   (NO /api here)
export const api = axios.create({
  baseURL: base,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;