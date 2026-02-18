import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import { getLatLng } from "../lib/geo";
import { fixLeafletIcon } from "../lib/leafletIcons";

fixLeafletIcon();

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    map.fitBounds(points, { padding: [30, 30] });
  }, [points, map]);

  return null;
}

export default function RouteMapPanel({ stopsOrdered, polyline }) {
  const markers = useMemo(() => {
    return stopsOrdered
      .map((s, idx) => {
        const st = s.station;
        const c = getLatLng(st);
        if (!st || !c) return null;
        return { id: String(st._id), name: st.name, lat: c.lat, lng: c.lng, idx };
      })
      .filter(Boolean);
  }, [stopsOrdered]);

  const points = useMemo(() => markers.map((m) => [m.lat, m.lng]), [markers]);
  const center = points[0] || [6.9271, 79.8612];

  const fitPoints = polyline?.length >= 2 ? polyline : points;

  return (
    <div style={{ height: 520, width: "100%", overflow: "hidden", borderRadius: 16, border: "1px solid #eee" }}>
      <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
        {/* Base map */}
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Railway overlay */}
        <TileLayer url="https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png" attribution="&copy; OpenRailwayMap contributors" />

        <FitBounds points={fitPoints} />

        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>
              <div style={{ fontWeight: 800 }}>
                {m.idx + 1}. {m.name}
              </div>
            </Popup>
          </Marker>
        ))}

        {polyline?.length >= 2 ? (
          <Polyline positions={polyline} />
        ) : points.length >= 2 ? (
          <Polyline positions={points} />
        ) : null}
      </MapContainer>
    </div>
  );
}
