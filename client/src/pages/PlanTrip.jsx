import { useState } from "react";
import { useAuth } from "../state/AuthContext";
import PlaceInput from "../components/PlaceInput";
import MapPicker from "../components/MapPicker";
import { getRoute } from "../lib/osrm";
import { api } from "../lib/api";
import TransportPlannerNav from "../components/TransportPlannerNav";

export default function PlanTrip() {
  const { user } = useAuth();

  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);

  const [pickupText, setPickupText] = useState("");
  const [dropoffText, setDropoffText] = useState("");

  const [activePin, setActivePin] = useState("pickup");

  const [routePoints, setRoutePoints] = useState([]);
  const [meta, setMeta] = useState(null);

  const [mode, setMode] = useState("pool");
  const [seats, setSeats] = useState(1);
  const [pickupTime, setPickupTime] = useState("");
  const [loading, setLoading] = useState(false);

  async function buildRoute(p, d) {
    if (!p || !d) return;

    const route = await getRoute(p, d);
    setRoutePoints(route.pathLatLng);
    setMeta(route);
  }

  async function findMatches() {
    if (!pickup || !dropoff) return alert("Select pickup & drop-off.");
    if (!pickupTime) return alert("Select pickup time.");

    setLoading(true);

    try {
      const reqRes = await api.post("/api/requests", {
        mode,
        seats: Number(seats),
        pickupTime,
        origin: {
          lat: pickup.lat,
          lng: pickup.lng,
          label: pickup.label,
        },
        destination: {
          lat: dropoff.lat,
          lng: dropoff.lng,
          label: dropoff.label,
        },
        distanceMeters: meta?.distanceMeters ?? null,
        durationSeconds: meta?.durationSeconds ?? null,
      });

      const requestId = reqRes.data?.request?._id || reqRes.data?._id;

      const matchRes = await api.get(`/api/matches/find/${requestId}`);
      console.log("matches", matchRes.data);

      alert("Matches fetched. (Check console) Next: build Matches UI.");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to find matches");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060812] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <TransportPlannerNav />

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 space-y-4 lg:col-span-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-semibold">Plan your DropMe journey</h1>
                  <p className="mt-1 text-sm text-white/60">
                    Type or click on map to select points.
                  </p>
                </div>

                <div className="mt-1 text-xs text-white/50">
                  {user ? `Signed in: ${user.role}` : "Not signed in"}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <PlaceInput
                  label="Pick-up"
                  placeholder="Type pickup location"
                  valueLabel={pickupText}
                  onValueLabelChange={setPickupText}
                  onSelect={(point) => {
                    setPickup(point);
                    setPickupText(point.label);
                    setActivePin("dropoff");

                    if (dropoff) {
                      buildRoute(point, dropoff);
                    }
                  }}
                />

                <PlaceInput
                  label="Drop-off"
                  placeholder="Type drop-off location"
                  valueLabel={dropoffText}
                  onValueLabelChange={setDropoffText}
                  onSelect={(point) => {
                    setDropoff(point);
                    setDropoffText(point.label);

                    if (pickup) {
                      buildRoute(pickup, point);
                    }
                  }}
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActivePin("pickup")}
                    className={[
                      "rounded-xl border px-3 py-2 text-sm transition",
                      activePin === "pickup"
                        ? "border-white/40 bg-white/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10",
                    ].join(" ")}
                  >
                    Set Pick-up on map
                  </button>

                  <button
                    onClick={() => setActivePin("dropoff")}
                    className={[
                      "rounded-xl border px-3 py-2 text-sm transition",
                      activePin === "dropoff"
                        ? "border-white/40 bg-white/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10",
                    ].join(" ")}
                  >
                    Set Drop-off on map
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "pool", title: "Pool", desc: "Share ride" },
                    { id: "private", title: "Private", desc: "Solo ride" },
                    { id: "transit", title: "Transit", desc: "Public" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setMode(item.id)}
                      className={[
                        "rounded-xl border px-3 py-3 text-left transition",
                        mode === item.id
                          ? "border-white/40 bg-white/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-xs text-white/60">{item.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Pick-up time
                    </label>
                    <input
                      type="datetime-local"
                      value={pickupTime}
                      onChange={(event) => setPickupTime(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/70">Seats</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={seats}
                      onChange={(event) => setSeats(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                {meta && (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Distance</span>
                      <span>{(meta.distanceMeters / 1000).toFixed(1)} km</span>
                    </div>

                    <div className="mt-2 flex justify-between">
                      <span className="text-white/60">ETA</span>
                      <span>{Math.round(meta.durationSeconds / 60)} min</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={findMatches}
                  disabled={loading}
                  className="w-full rounded-xl bg-white py-3 font-semibold text-black hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? "Searching..." : "Find pool matches"}
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8">
            <MapPicker
              pickup={pickup}
              dropoff={dropoff}
              active={activePin}
              routePoints={routePoints}
              onChangePickup={(point) => {
                setPickup(point);
                setPickupText(point.label);

                if (dropoff) {
                  buildRoute(point, dropoff);
                }
              }}
              onChangeDropoff={(point) => {
                setDropoff(point);
                setDropoffText(point.label);

                if (pickup) {
                  buildRoute(pickup, point);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}