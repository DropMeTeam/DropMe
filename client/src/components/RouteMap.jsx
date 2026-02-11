import { GoogleMap, DirectionsRenderer, Marker } from "@react-google-maps/api";

const defaultCenter = { lat: 6.9271, lng: 79.8612 }; // Colombo

export default function RouteMap({ origin, destination, directions }) {
  return (
    <div className="h-[520px] w-full overflow-hidden rounded-2xl border border-zinc-800">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={origin?.point ?? defaultCenter}
        zoom={13}
        options={{ disableDefaultUI: true, zoomControl: true }}
      >
        {origin?.point ? <Marker position={origin.point} /> : null}
        {destination?.point ? <Marker position={destination.point} /> : null}
        {directions ? <DirectionsRenderer directions={directions} /> : null}
      </GoogleMap>
    </div>
  );
}
