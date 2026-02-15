export async function reverseGeocode(lat, lng) {
  const url =
    "https://nominatim.openstreetmap.org/reverse?" +
    new URLSearchParams({
      format: "json",
      lat: String(lat),
      lon: String(lng),
      zoom: "18",
      addressdetails: "1",
    }).toString();

  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  return data?.display_name || `My location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
}
