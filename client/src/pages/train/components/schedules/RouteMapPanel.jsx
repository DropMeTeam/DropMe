import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { getLatLng } from "../../lib/geo";
import { fixLeafletIcon } from "../../lib/leafletIcons";

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

export default function RouteMapPanel({ stopsOrdered, polyline, height = 520 }) {
  const markers = useMemo(() => {
    return stopsOrdered
      .map((stop, index) => {
        const station = stop.station;
        const coords = getLatLng(station);
        if (!station || !coords) return null;
        return { id: String(station._id), name: station.name, lat: coords.lat, lng: coords.lng, idx: index };
      })
      .filter(Boolean);
  }, [stopsOrdered]);

  const points = useMemo(() => markers.map((marker) => [marker.lat, marker.lng]), [markers]);
  const center = points[0] || [6.9271, 79.8612];
  const fitPoints = polyline?.length >= 2 ? polyline : points;

  return (
    <div
      style={{ height, width: "100%" }}
      className="overflow-hidden rounded-[24px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
    >
      <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <TileLayer
          url="https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
          attribution="&copy; OpenRailwayMap contributors"
        />

        <FitBounds points={fitPoints} />

        {markers.map((marker) => (
          <Marker key={marker.id} position={[marker.lat, marker.lng]}>
            <Popup>
              <div style={{ fontWeight: 800 }}>
                {marker.idx + 1}. {marker.name}
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
