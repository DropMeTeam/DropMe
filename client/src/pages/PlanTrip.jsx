import { useMemo, useState } from "react";
import { useLoadScript, DirectionsService } from "@react-google-maps/api";
import { useAuth } from "../state/AuthContext";
import PlaceInput from "../components/PlaceInput";
import RouteMap from "../components/RouteMap";
import RideOptions from "../components/RideOptions";
import { api } from "../lib/api";

const libraries = ["places"];

export default function PlanTrip() {
  const { user } = useAuth();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [mode, setMode] = useState("POOL");
  const [pickupTime, setPickupTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [timeWindowMins, setTimeWindowMins] = useState(15);
  const [seatsNeeded, setSeatsNeeded] = useState(1);

  const [directions, setDirections] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState([]);

  const canRoute = Boolean(origin?.point && destination?.point && isLoaded);

  const travelMode = useMemo(() => (mode === "TRANSIT" ? "TRANSIT" : "DRIVING"), [mode]);

  const dirRequest = useMemo(() => {
    if (!canRoute) return null;
    return {
      origin: origin.point,
      destination: destination.point,
      travelMode,
      provideRouteAlternatives: true
    };
  }, [canRoute, origin, destination, travelMode]);

  async function runMatching() {
    if (!user) return alert("Log in to request pool matches.");
    if (!origin || !destination) return;

    setBusy(true);
    setMatches([]);
    try {
      const { data: r } = await api.post("/api/requests", {
        origin,
        destination,
        pickupTime: new Date(pickupTime).toISOString(),
        timeWindowMins: Number(timeWindowMins),
        seatsNeeded: Number(seatsNeeded),
        mode
      });

      const { data: m } = await api.post("/api/matches/find", {
        requestId: r.request._id,
        originMaxM: 3000,
        destMaxM: 3500
      });

      setMatches(m.matches || []);
    } catch (e) {
      alert(e?.response?.data?.error || "Matching failed");
    } finally {
      setBusy(false);
    }
  }

  async function acceptMatch(matchId) {
    setBusy(true);
    try {
      await api.post(`/api/matches/${matchId}/accept`);
      alert("Match accepted (MVP). Next step: create Trip + tracking.");
    } catch (e) {
      alert(e?.response?.data?.error || "Accept failed");
    } finally {
      setBusy(false);
    }
  }

  if (!isLoaded) return <div className="p-6">Loading Maps…</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="card p-5 lg:col-span-2">
        <div className="text-lg font-semibold">Plan a trip</div>
        <div className="mt-1 text-sm text-zinc-400">Pickup, destination, schedule, then choose mode.</div>

        <div className="mt-5 grid gap-3">
          <PlaceInput value={origin} onChange={setOrigin} placeholder="Pickup location" />
          <PlaceInput value={destination} onChange={setDestination} placeholder="Drop-off location" />

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

          {mode !== "TRANSIT" ? (
            <div>
              <div className="mb-1 text-xs text-zinc-400">Seats</div>
              <input type="number" className="input" min={1} max={2} value={seatsNeeded} onChange={(e) => setSeatsNeeded(e.target.value)} />
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2">
            {mode === "POOL" ? (
              <button className="btn-primary btn" type="button" disabled={busy || !canRoute} onClick={runMatching}>
                {busy ? "Matching…" : "Find pool matches"}
              </button>
            ) : (
              <button className="btn-primary btn" type="button" disabled={!canRoute} onClick={() => {}}>
                Show route
              </button>
            )}

            <button
              className="btn-ghost btn"
              type="button"
              onClick={() => {
                setOrigin(null);
                setDestination(null);
                setDirections(null);
                setMetrics(null);
                setMatches([]);
              }}
            >
              Reset
            </button>
          </div>

          {matches?.length ? (
            <div className="mt-4">
              <div className="text-sm font-semibold">Matches</div>
              <div className="mt-2 grid gap-2">
                {matches.map((m) => (
                  <div key={m._id} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">Driver offer</div>
                        <div className="text-xs text-zinc-400">
                          Seats left: {m.offerId.seatsAvailable} • Score: {m.score.toFixed(1)}
                        </div>
                      </div>
                      <button className="btn-primary btn" type="button" disabled={busy} onClick={() => acceptMatch(m._id)}>
                        Accept
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-zinc-400">
                      {m.offerId.origin.address || "Origin"} → {m.offerId.destination.address || "Destination"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="lg:col-span-3">
        <RouteMap origin={origin} destination={destination} directions={directions} />

        <div className="mt-4">
          <RideOptions metrics={metrics} mode={mode} setMode={setMode} />
        </div>

        {dirRequest ? (
          <DirectionsService
            options={dirRequest}
            callback={(res, status) => {
              if (status !== "OK" || !res) return;
setDirections(res);
const leg = res?.routes?.[0]?.legs?.[0];
if (leg?.distance?.value && leg?.duration?.value) {
  setMetrics({
    distanceKm: leg.distance.value / 1000,
    durationMins: leg.duration.value / 60
  });
}
            }}
          />
        ) : null}

        <div className="mt-4 card p-5">
          <div className="text-sm font-semibold">Transit mode</div>
          <div className="mt-1 text-sm text-zinc-300">
            Set mode to <span className="font-medium">Transit</span> to render public transport directions (Google Directions API).
          </div>
        </div>
      </div>
    </div>
  );
}
