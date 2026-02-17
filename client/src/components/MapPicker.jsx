import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default marker icons in Vite
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Uber-like blue dot icon (no external asset)
const blueDotIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 14px; height: 14px;
      background: #3b82f6;
      border: 3px solid rgba(255,255,255,0.95);
      border-radius: 9999px;
      box-shadow: 0 0 0 6px rgba(59,130,246,0.25);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// Reverse geocode (lat,lng -> address label) using free Nominatim
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

// Fly-to controller (triggered by flyToKey changes)
function FlyToLocation({ target, zoom = 16, triggerKey }) {
  const map = useMap();

  useEffect(() => {
    if (!target?.lat || !target?.lng) return;
    map.flyTo([target.lat, target.lng], zoom, { animate: true, duration: 0.8 });
  }, [triggerKey]);

  return null;
}

export default function MapPicker({
  pickup,
  dropoff,
  myLoc, // { lat, lng, accuracyMeters }

  active = "pickup", // pickup | dropoff
  onChangePickup,
  onChangeDropoff,

  routePoints = [],

  // Fly-to controls
  flyTo = null,     // { lat, lng }
  flyToKey = 0,     // increment to trigger
  flyZoom = 16,
}) {
  const [busy, setBusy] = useState(false);

  const center = useMemo(() => {
    if (pickup?.lat && pickup?.lng) return [pickup.lat, pickup.lng];
    if (myLoc?.lat && myLoc?.lng) return [myLoc.lat, myLoc.lng];
    return [6.9271, 79.8612]; // Colombo default
  }, [pickup, myLoc]);

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

          {/* Fly to requested target */}
          {flyTo?.lat && flyTo?.lng && (
            <FlyToLocation target={flyTo} zoom={flyZoom} triggerKey={flyToKey} />
          )}

          {/* Click to set pickup/dropoff */}
          <ClickHandler active={active} onPick={handlePick} />

          {/* Blue dot + accuracy circle */}
          {myLoc?.lat && myLoc?.lng && (
            <>
              {typeof myLoc.accuracyMeters === "number" && (
                <Circle
                  center={[myLoc.lat, myLoc.lng]}
                  radius={Math.max(10, myLoc.accuracyMeters)}
                  pathOptions={{
                    color: "#60a5fa",
                    fillColor: "#60a5fa",
                    fillOpacity: 0.15,
                    weight: 1,
                  }}
                />
              )}
              <Marker position={[myLoc.lat, myLoc.lng]} icon={blueDotIcon} />
            </>
          )}

          {/* Markers */}
          {pickup?.lat && pickup?.lng && <Marker position={[pickup.lat, pickup.lng]} />}
          {dropoff?.lat && dropoff?.lng && <Marker position={[dropoff.lat, dropoff.lng]} />}

          {/* Route */}
          {routePoints?.length > 1 && <Polyline positions={routePoints} />}
        </MapContainer>
      </div>
    </div>
  );
}
