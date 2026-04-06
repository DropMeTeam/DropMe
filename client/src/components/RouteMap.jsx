import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function normalizePoint(point) {
  if (!point) return null;

  if (
    typeof point?.lat === "number" &&
    typeof point?.lng === "number"
  ) {
    return { lat: point.lat, lng: point.lng };
  }

  if (Array.isArray(point) && point.length >= 2) {
    const [lat, lng] = point.map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

function normalizePoints(points) {
  if (!Array.isArray(points)) return [];

  return points
    .map((point) => normalizePoint(point))
    .filter(Boolean);
}

function samePoint(a, b) {
  if (!a || !b) return false;
  return a.lat === b.lat && a.lng === b.lng;
}

function dedupePoints(points) {
  const out = [];

  for (const point of points) {
    const prev = out[out.length - 1];
    if (!samePoint(prev, point)) {
      out.push(point);
    }
  }

  return out;
}

function FitBoundsController({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!Array.isArray(points) || points.length === 0) return;

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
      return;
    }

    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [map, points]);

  return null;
}

function PointMarker({
  point,
  color,
  borderColor = "#ffffff",
  radius = 8,
  label,
}) {
  if (!point) return null;

  return (
    <CircleMarker
      center={[point.lat, point.lng]}
      radius={radius}
      pathOptions={{
        color: borderColor,
        weight: 2,
        fillColor: color,
        fillOpacity: 1,
      }}
    >
      <Tooltip direction="top" offset={[0, -8]} opacity={1}>
        {label}
      </Tooltip>
    </CircleMarker>
  );
}

export default function RouteMap({
  pickup,
  boardingPoint,
  destinationPoint,
  routePoints,
  trainRoutePoints,
}) {
  const safePickup = normalizePoint(pickup);
  const safeBoarding = normalizePoint(boardingPoint);
  const safeDestination = normalizePoint(destinationPoint);

  const safeAccessRoute = dedupePoints(normalizePoints(routePoints));
  const safeTrainRoute = dedupePoints(normalizePoints(trainRoutePoints));

  const fitPoints = dedupePoints([
    ...safeAccessRoute,
    ...safeTrainRoute,
    ...(safePickup ? [safePickup] : []),
    ...(safeBoarding ? [safeBoarding] : []),
    ...(safeDestination ? [safeDestination] : []),
  ]);

  const defaultCenter = safeBoarding || safeDestination || safePickup || { lat: 6.9271, lng: 79.8612 };

  return (
    <MapContainer
      center={[defaultCenter.lat, defaultCenter.lng]}
      zoom={11}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBoundsController points={fitPoints} />

      {safeAccessRoute.length > 1 ? (
        <Polyline
          positions={safeAccessRoute.map((p) => [p.lat, p.lng])}
          pathOptions={{
            color: "#22d3ee",
            weight: 5,
            opacity: 0.95,
          }}
        />
      ) : null}

      {safeTrainRoute.length > 1 ? (
        <Polyline
          positions={safeTrainRoute.map((p) => [p.lat, p.lng])}
          pathOptions={{
            color: "#fb7185",
            weight: 5,
            opacity: 0.95,
          }}
        />
      ) : null}

      <PointMarker
        point={safePickup}
        color="#22d3ee"
        borderColor="#083344"
        radius={7}
        label="My location"
      />

      <PointMarker
        point={safeBoarding}
        color="#3b82f6"
        borderColor="#1e3a8a"
        radius={8}
        label="Boarding station"
      />

      <PointMarker
        point={safeDestination}
        color="#fb7185"
        borderColor="#881337"
        radius={8}
        label="Destination station"
      />
    </MapContainer>
  );
}