import { useState } from "react";
import { useAuth } from "../state/AuthContext";
import PlaceInput from "../components/PlaceInput";
import RouteMap from "../components/RouteMap";
import { getRoute } from "../lib/osrm";
import { api } from "../lib/api";


export default function PlanTrip() {
  const { user } = useAuth();

  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);

  const [routePoints, setRoutePoints] = useState([]);
  const [meta, setMeta] = useState(null);

  const [mode, setMode] = useState("pool"); // pool | private | transit (ui only)
  const [seats, setSeats] = useState(1);
  const [pickupTime, setPickupTime] = useState(""); // datetime-local
  const [loading, setLoading] = useState(false);

  async function buildRoute(p, d) {
    if (!p || !d) return;
    const r = await getRoute(p, d);
    setRoutePoints(r.pathLatLng);
    setMeta(r);
  }

  async function findMatches() {
    if (!pickup || !dropoff) return alert("Select pickup & drop-off.");
    if (!pickupTime) return alert("Select pickup time.");

    setLoading(true);
    try {
      // Create rider request
      const reqRes = await api.post("/api/requests", {
        mode,
        seats: Number(seats),
        pickupTime,
        origin: { lat: pickup.lat, lng: pickup.lng, label: pickup.display },
        destination: { lat: dropoff.lat, lng: dropoff.lng, label: dropoff.display },
        distanceMeters: meta?.distanceMeters ?? null,
        durationSeconds: meta?.durationSeconds ?? null,
      });

      const requestId = reqRes.data?.request?._id || reqRes.data?._id;

      // Find pool matches (backend matching)
      const matchRes = await api.get(`/api/matches/find/${requestId}`);
      console.log("matches", matchRes.data);

      alert("Matches fetched. (Check console) Next step: build Matches UI.");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to find matches");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060812] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8 grid grid-cols-12 gap-6">
        {/* Left panel */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold">Plan your DropMe journey</h1>
                <p className="text-sm text-white/60 mt-1">
                  Pool-first matching with a clean workflow.
                </p>
              </div>
              <div className="text-xs text-white/50 mt-1">
                {user ? `Signed in: ${user.role}` : "Not signed in"}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <PlaceInput
                label="Pick-up"
                placeholder="Search pickup location"
                onSelect={(p) => {
                  setPickup(p);
                  if (dropoff) buildRoute(p, dropoff);
                }}
              />

              <PlaceInput
                label="Drop-off"
                placeholder="Search drop-off location"
                onSelect={(d) => {
                  setDropoff(d);
                  if (pickup) buildRoute(pickup, d);
                }}
              />

              {/* Trip mode cards */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "pool", title: "Pool", desc: "Share ride, save cost" },
                  { id: "private", title: "Private", desc: "Solo ride" },
                  { id: "transit", title: "Transit", desc: "Public transport" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={
                      "rounded-xl border px-3 py-3 text-left transition " +
                      (mode === m.id
                        ? "border-white/40 bg-white/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10")
                    }
                  >
                    <div className="font-semibold">{m.title}</div>
                    <div className="text-xs text-white/60">{m.desc}</div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Pick-up time</label>
                  <input
                    type="datetime-local"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Seats</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
                  />
                </div>
              </div>

              {meta && (
                <div className="rounded-xl bg-black/30 border border-white/10 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Distance</span>
                    <span>{(meta.distanceMeters / 1000).toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-white/60">ETA</span>
                    <span>{Math.round(meta.durationSeconds / 60)} min</span>
                  </div>
                </div>
              )}

              <button
                onClick={findMatches}
                disabled={loading}
                className="w-full rounded-xl bg-white text-black font-semibold py-3 hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Searching..." : "Find pool matches"}
              </button>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="col-span-12 lg:col-span-8">
          <RouteMap pickup={pickup} dropoff={dropoff} routePoints={routePoints} />
        </div>
      </div>
    </div>
  );
}
