import { useState } from "react";
import PlaceSearch from "../../components/PlaceSearch";
import RouteMap from "../../components/RouteMap";
import { getRoute } from "../../lib/osrm";
import api from "../../lib/api";

export default function OfferRide() {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [meta, setMeta] = useState(null);

  const [departAt, setDepartAt] = useState("");
  const [seats, setSeats] = useState(3);
  const [priceLkr, setPriceLkr] = useState(0);
  const [loading, setLoading] = useState(false);

  async function buildRoute(nextFrom, nextTo) {
    if (!nextFrom || !nextTo) return;
    const r = await getRoute(nextFrom, nextTo);
    setRoutePoints(r.pathLatLng);
    setMeta(r);
  }

  async function submit() {
    if (!from || !to || !departAt) {
      alert("Please set pickup, drop-off and departure time.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/offers", {
        origin: { lat: from.lat, lng: from.lng, label: from.display },
        destination: { lat: to.lat, lng: to.lng, label: to.display },
        departAt,
        seats: Number(seats),
        priceLkr: Number(priceLkr),
        // store route summary for matching + display
        distanceMeters: meta?.distanceMeters ?? null,
        durationSeconds: meta?.durationSeconds ?? null,
      });

      alert("Ride offer published!");
      // reset
      setFrom(null);
      setTo(null);
      setRoutePoints([]);
      setMeta(null);
      setDepartAt("");
      setSeats(3);
      setPriceLkr(0);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to publish offer");
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
            <h1 className="text-xl font-semibold">Offer a ride</h1>
            <p className="text-sm text-white/60 mt-1">
              Publish your route. DropMe will match riders going the same way.
            </p>

            <div className="mt-5 space-y-4">
              <PlaceSearch
                label="Start (pick-up area)"
                placeholder="Search pickup location"
                onSelect={(p) => {
                  setFrom(p);
                  if (to) buildRoute(p, to);
                }}
              />

              <PlaceSearch
                label="Destination"
                placeholder="Search drop-off location"
                onSelect={(d) => {
                  setTo(d);
                  if (from) buildRoute(from, d);
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    Departure time
                  </label>
                  <input
                    type="datetime-local"
                    value={departAt}
                    onChange={(e) => setDepartAt(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    Seats
                  </label>
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

              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Price (LKR) (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={priceLkr}
                  onChange={(e) => setPriceLkr(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
                />
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
                onClick={submit}
                disabled={loading}
                className="w-full rounded-xl bg-white text-black font-semibold py-3 hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Publishing..." : "Publish Offer"}
              </button>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="col-span-12 lg:col-span-8">
          <RouteMap pickup={from} dropoff={to} routePoints={routePoints} />
        </div>
      </div>
    </div>
  );
}
