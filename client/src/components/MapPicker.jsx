import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { geoReverse } from "../lib/geoApi";

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

// Offer marker icon (optional; used if offers prop passed)
const offerIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 14px; height: 14px;
      background: #22c55e;
      border: 3px solid rgba(255,255,255,0.95);
      border-radius: 9999px;
      box-shadow: 0 0 0 6px rgba(34,197,94,0.20);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

async function reverseGeocodeSafe(lat, lng) {
  try {
    return await geoReverse(lat, lng);
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
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

  flyTo = null,
  flyToKey = 0,
  flyZoom = 16,

  // optional
  offers = [],
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
      const label = await reverseGeocodeSafe(latlng.lat, latlng.lng);
      const next = { label, lat: latlng.lat, lng: latlng.lng };

      if (which === "pickup") onChangePickup?.(next);
      else onChangeDropoff?.(next);
    } finally {
      setBusy(false);
    }
  }

  function getOfferLatLng(o) {
    const coords = o?.origin?.point?.coordinates;
    if (!coords || coords.length !== 2) return null;
    const [lng, lat] = coords;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
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

          {flyTo?.lat && flyTo?.lng && (
            <FlyToLocation target={flyTo} zoom={flyZoom} triggerKey={flyToKey} />
          )}

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

          {/* Offers markers */}
          {(offers || []).map((o) => {
            const ll = getOfferLatLng(o);
            if (!ll) return null;
            const driver = o?.driverSnapshot || {};
            const vehicle = o?.vehicleSnapshot || {};

            return (
              <Marker key={o._id} position={[ll.lat, ll.lng]} icon={offerIcon}>
                <Popup>
                  <div style={{ minWidth: 240 }}>
                    <div style={{ fontWeight: 700 }}>{driver?.name || "Driver"}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {o?.origin?.address || "Origin"} → {o?.destination?.address || "Destination"}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                      Pickup: {o?.pickupTime ? new Date(o.pickupTime).toLocaleString() : "—"}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      Seats: {o?.seatsAvailable}/{o?.seatsTotal}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      Vehicle: {vehicle?.type || "—"} • {vehicle?.number || "—"} • {vehicle?.color || "—"}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      Price: {o?.priceLkr ? `LKR ${o.priceLkr}` : "—"}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {routePoints?.length > 1 && <Polyline positions={routePoints} />}
        </MapContainer>
      </div>
    </div>
  );
}