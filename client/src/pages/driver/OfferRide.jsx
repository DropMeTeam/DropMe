import { useState } from "react";
import PlaceInput from "../../components/PlaceInput";
import MapPicker from "../../components/MapPicker";
import { getRoute } from "../../lib/osrm";
import api from "../../lib/api";

export default function OfferRide() {
  // unified point shape: { label, lat, lng }
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  // controlled text inputs
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");

  // map click target
  const [activePin, setActivePin] = useState("pickup"); // pickup | dropoff

  // route
  const [routePoints, setRoutePoints] = useState([]);
  const [meta, setMeta] = useState(null);

  // form
  const [pickupTime, setPickupTime] = useState("");
  const [seatsTotal, setSeatsTotal] = useState(3);
  const [priceLkr, setPriceLkr] = useState(0);
  const [loading, setLoading] = useState(false);

  async function buildRoute(nextFrom, nextTo) {
    if (!nextFrom || !nextTo) return;
    const r = await getRoute(nextFrom, nextTo);
    setRoutePoints(r.pathLatLng);
    setMeta(r);
  }

  async function submit() {
    if (!from || !to || !pickupTime) {
      alert("Please set pickup, drop-off and pickup time.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/offers", {
        origin: { point: { lat: from.lat, lng: from.lng }, address: from.label },
        destination: { point: { lat: to.lat, lng: to.lng }, address: to.label },

        pickupTime,
        seatsTotal: Number(seatsTotal),
        priceLkr: Number(priceLkr),

        routePolyline: meta?.polyline || "",
      });

      alert("Ride offer published!");

      // reset
      setFrom(null);
      setTo(null);
      setFromText("");
      setToText("");
      setActivePin("pickup");
      setRoutePoints([]);
      setMeta(null);
      setPickupTime("");
      setSeatsTotal(3);
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
        {/* LEFT PANEL */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h1 className="text-xl font-semibold">Offer a ride</h1>
            <p className="text-sm text-white/60 mt-1">
              Type locations or click on the map to set pickup and drop-off.
            </p>

            <div className="mt-5 space-y-4">
              <PlaceInput
                label="Start (pick-up area)"
                placeholder="Type pickup location"
                valueLabel={fromText}
                onValueLabelChange={setFromText}
                onSelect={(p) => {
                  setFrom(p);
                  setFromText(p.label);
                  setActivePin("dropoff");
                  if (to) buildRoute(p, to);
                }}
              />

              <PlaceInput
                label="Destination"
                placeholder="Type drop-off location"
                valueLabel={toText}
                onValueLabelChange={setToText}
                onSelect={(d) => {
                  setTo(d);
                  setToText(d.label);
                  if (from) buildRoute(from, d);
                }}
              />

              {/* NEW: map click toggle buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActivePin("pickup")}
                  className={
                    "rounded-xl border px-3 py-2 text-sm " +
                    (activePin === "pickup"
                      ? "border-white/40 bg-white/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10")
                  }
                >
                  Set Pick-up on map
                </button>
                <button
                  type="button"
                  onClick={() => setActivePin("dropoff")}
                  className={
                    "rounded-xl border px-3 py-2 text-sm " +
                    (activePin === "dropoff"
                      ? "border-white/40 bg-white/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10")
                  }
                >
                  Set Drop-off on map
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Pick-up time</label>
                  <input
                    type="datetime-local"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Seats</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={seatsTotal}
                    onChange={(e) => setSeatsTotal(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Price (LKR) (optional)</label>
                <input
                  type="number"
                  min="0"
                  value={priceLkr}
                  onChange={(e) => setPriceLkr(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                />
              </div>

              <button
                onClick={submit}
                disabled={loading}
                className="w-full rounded-xl bg-white text-black font-semibold py-3 disabled:opacity-60"
              >
                {loading ? "Publishing..." : "Publish Offer"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT MAP */}
        <div className="col-span-12 lg:col-span-8">
          <MapPicker
            pickup={from}
            dropoff={to}
            active={activePin}
            routePoints={routePoints}
            onChangePickup={(p) => {
              setFrom(p);
              setFromText(p.label);
              setActivePin("dropoff");
              if (to) buildRoute(p, to);
            }}
            onChangeDropoff={(d) => {
              setTo(d);
              setToText(d.label);
              if (from) buildRoute(from, d);
            }}
          />
        </div>
      </div>
    </div>
  );
}