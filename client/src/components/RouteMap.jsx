import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";

function toLeafletPoint(point) {
  if (!point) return null;

  if (Array.isArray(point) && point.length >= 2) {
    const lat = Number(point[0]);
    const lng = Number(point[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng];
    }
    return null;
  }

  const lat = Number(point?.lat);
  const lng = Number(point?.lng);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return [lat, lng];
  }

  return null;
}

function normalizePolyline(points = []) {
  return points.map(toLeafletPoint).filter(Boolean);
}

function FitBounds({
  pickup,
  boardingPoint,
  destinationPoint,
  routePoints,
  trainRoutePoints,
}) {
  const map = useMap();

  useEffect(() => {
    const points = [];

    const pickupPoint = toLeafletPoint(pickup);
    const boarding = toLeafletPoint(boardingPoint);
    const destination = toLeafletPoint(destinationPoint);

    if (pickupPoint) points.push(pickupPoint);
    if (boarding) points.push(boarding);
    if (destination) points.push(destination);

    points.push(...normalizePolyline(routePoints));
    points.push(...normalizePolyline(trainRoutePoints));

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [map, pickup, boardingPoint, destinationPoint, routePoints, trainRoutePoints]);

  return null;
}

export default function RouteMap({
  pickup,
  boardingPoint,
  destinationPoint,
  routePoints = [],
  trainRoutePoints = [],
}) {
  const pickupPoint = toLeafletPoint(pickup);
  const boarding = toLeafletPoint(boardingPoint);
  const destination = toLeafletPoint(destinationPoint);

  const accessPolyline = useMemo(
    () => normalizePolyline(routePoints),
    [routePoints]
  );

  const trainPolyline = useMemo(
    () => normalizePolyline(trainRoutePoints),
    [trainRoutePoints]
  );

  const center =
    pickupPoint ||
    boarding ||
    destination ||
    [6.9271, 79.8612];

  const hasAccessRoute = accessPolyline.length > 0;
  const hasTrainRoute = trainPolyline.length > 0;

  return (
    <div className="h-[520px] w-full overflow-hidden rounded-2xl border border-white/10">
      <MapContainer center={center} zoom={12} className="h-full w-full">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds
          pickup={pickup}
          boardingPoint={boardingPoint}
          destinationPoint={destinationPoint}
          routePoints={routePoints}
          trainRoutePoints={trainRoutePoints}
        />

        {pickupPoint && <Marker position={pickupPoint} />}
        {boarding && <Marker position={boarding} />}
        {destination && <Marker position={destination} />}

        {hasAccessRoute && (
          <Polyline
            positions={accessPolyline}
            pathOptions={{
              color: "#22d3ee",
              weight: 5,
              opacity: 0.95,
            }}
          />
        )}

        {hasTrainRoute && (
          <Polyline
            positions={trainPolyline}
            pathOptions={{
              color: "#fb7185",
              weight: 4,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}