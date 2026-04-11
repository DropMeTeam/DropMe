import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
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

export default function RouteMapPanel({
  stopsOrdered,
  polyline,
  height = 520,
}) {
  const markers = useMemo(() => {
    return stopsOrdered
      .map((stop, index) => {
        const station = stop.station;
        const coords = getLatLng(station);

        if (!station || !coords) return null;

        return {
          id: String(station._id),
          name: station.name,
          lat: coords.lat,
          lng: coords.lng,
          idx: index,
        };
      })
      .filter(Boolean);
  }, [stopsOrdered]);

  const points = useMemo(
    () => markers.map((marker) => [marker.lat, marker.lng]),
    [markers]
  );

  const routePoints = useMemo(() => {
    return Array.isArray(polyline) ? polyline : [];
  }, [polyline]);

  const center = points[0] || [6.9271, 79.8612];
  const fitPoints = routePoints.length >= 2 ? routePoints : points;

  return (
    <div
      style={{ height, width: "100%" }}
      className="overflow-hidden rounded-[24px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
    >
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds points={fitPoints} />

        {routePoints.length >= 2 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: "#2563eb",
              weight: 5,
              opacity: 0.95,
            }}
          />
        )}

        {markers.map((marker, index) => (
          <Marker key={`${marker.id}-${index}`} position={[marker.lat, marker.lng]}>
            <Popup>
              <div>
                <strong>{marker.name}</strong>
                <br />
                Stop {marker.idx + 1}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}