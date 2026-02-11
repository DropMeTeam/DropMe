import { useMemo, useState } from "react";
import { useLoadScript, DirectionsService } from "@react-google-maps/api";
import PlaceInput from "../../components/PlaceInput";
import RouteMap from "../../components/RouteMap";
import { api } from "../../lib/api";
import { useNavigate } from "react-router-dom";

const libraries = ["places"];

export default function OfferRide() {
  const nav = useNavigate();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [pickupTime, setPickupTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [timeWindowMins, setTimeWindowMins] = useState(15);
  const [seatsTotal, setSeatsTotal] = useState(3);

  const [directions, setDirections] = useState(null);

  const canRoute = Boolean(origin?.point && destination?.point && isLoaded);

  const dirRequest = useMemo(() => {
    if (!canRoute) return null;
    return { origin: origin.point, destination: destination.point, travelMode: "DRIVING" };
  }, [canRoute, origin, destination]);

  async function submit() {
    if (!origin || !destination) return;

    await api.post("/api/offers", {
      origin,
      destination,
      pickupTime: new Date(pickupTime).toISOString(),
      timeWindowMins: Number(timeWindowMins),
      seatsTotal: Number(seatsTotal),
      routePolyline: ""
    });

    nav("/driver");
  }

  if (!isLoaded) return <div className="p-6">Loading Maps…</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="card p-5 lg:col-span-2">
        <div className="text-lg font-semibold">Create ride offer</div>
        <div className="mt-1 text-sm text-zinc-400">Post route + time window + seats.</div>

        <div className="mt-5 grid gap-3">
          <PlaceInput value={origin} onChange={setOrigin} placeholder="Start location" />
          <PlaceInput value={destination} onChange={setDestination} placeholder="End location" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-xs text-zinc-400">Pickup time</div>
              <input type="datetime-local" className="input" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-400">Time window (mins)</div>
              <input type="number" className="input" min={0} max={120} value={timeWindowMins} onChange={(e) => setTimeWindowMins(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs text-zinc-400">Seats available</div>
            <input type="number" className="input" min={1} max={6} value={seatsTotal} onChange={(e) => setSeatsTotal(e.target.value)} />
          </div>

          <button className="btn-primary btn" type="button" disabled={!canRoute} onClick={submit}>
            Publish offer
          </button>
        </div>
      </div>

      <div className="lg:col-span-3">
        <RouteMap origin={origin} destination={destination} directions={directions} />

        {dirRequest ? (
          <DirectionsService
            options={dirRequest}
            callback={(res, status) => {
              if (status !== "OK" || !res) return;
              setDirections(res);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
