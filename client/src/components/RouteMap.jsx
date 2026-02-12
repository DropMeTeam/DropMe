import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";

export default function RouteMap({ pickup, dropoff, routePoints }) {
  const center = pickup
    ? [pickup.lat, pickup.lng]
    : [6.9271, 79.8612]; // Colombo default

  return (
    <div className="h-[520px] w-full overflow-hidden rounded-2xl border border-white/10">
      <MapContainer center={center} zoom={12} className="h-full w-full">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pickup && <Marker position={[pickup.lat, pickup.lng]} />}
        {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} />}

        {routePoints?.length > 0 && <Polyline positions={routePoints} />}
      </MapContainer>
    </div>
  );
}
