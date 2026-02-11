import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMemo, useRef, useState } from "react";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

async function reverseGeocode(lat, lng) {
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
  return data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function ClickHandler({ active, onPick }) {
  useMapEvents({
    click: (e) => onPick?.(active, e.latlng),
  });
  return null;
}

export default function MapPicker({
  pickup,
  dropoff,
  active = "pickup", // pickup | dropoff
  onChangePickup,
  onChangeDropoff,
  routePoints = [],
}) {
  const [busy, setBusy] = useState(false);

  const center = useMemo(() => {
    if (pickup?.lat && pickup?.lng) return [pickup.lat, pickup.lng];
    return [6.9271, 79.8612]; // Colombo
  }, [pickup]);

  async function handlePick(which, latlng) {
    setBusy(true);
    try {
      const label = await reverseGeocode(latlng.lat, latlng.lng);
      const next = { label, lat: latlng.lat, lng: latlng.lng };
      if (which === "pickup") onChangePickup?.(next);
      else onChangeDropoff?.(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="text-sm text-white/80">
          Click map to set:{" "}
          <span className="font-semibold">
            {active === "pickup" ? "Pick-up" : "Drop-off"}
          </span>
        </div>
        {busy && <div className="text-xs text-white/50">Resolving address…</div>}
      </div>

      <div className="h-[520px]">
        <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickHandler active={active} onPick={handlePick} />

          {pickup?.lat && pickup?.lng && <Marker position={[pickup.lat, pickup.lng]} />}
          {dropoff?.lat && dropoff?.lng && <Marker position={[dropoff.lat, dropoff.lng]} />}

          {routePoints?.length > 1 && <Polyline positions={routePoints} />}
        </MapContainer>
      </div>
    </div>
  );
}
