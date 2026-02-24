// src/lib/geoApi.js
import api from "./api"; // default export

export async function geoSearch(q) {
  const { data } = await api.get("/api/geo/search", { params: { q } });
  return data?.results || [];
}

export async function geoReverse(lat, lng) {
  const { data } = await api.get("/api/geo/reverse", {
    params: { lat, lng },
  });
  return data?.label || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}