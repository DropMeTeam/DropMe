import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const [priceLkr, setPriceLkr] = useState(0);
  const [loading, setLoading] = useState(false);

  // ✅ load driver registration to get seatsTotal
  const { data: regData } = useQuery({
    queryKey: ["driver-registration-me"],
    queryFn: async () => (await api.get("/api/driver-registration/me")).data,
  });

  const vehicleSeats = Number(regData?.driverRegistration?.vehicle?.seatsTotal || 0);

  // driver cannot publish past time
  const FUTURE_BUFFER_MS = 60 * 1000; // +1 minute

  function toDatetimeLocalString(d) {
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  const minPickupTime = useMemo(() => {
    return toDatetimeLocalString(new Date(Date.now() + FUTURE_BUFFER_MS));
  }, []);

  function parsePickupTime(value) {
    const dt = new Date(value);
    if (!value || Number.isNaN(dt.getTime())) return null;
    return dt;
  }

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

    if (!vehicleSeats || vehicleSeats < 1) {
      alert("Vehicle seats not found. Please submit driver registration first.");
      return;
    }

    const dt = parsePickupTime(pickupTime);
    if (!dt) {
      alert("Please select a valid pick-up time.");
      return;
    }
    if (dt.getTime() < Date.now() + FUTURE_BUFFER_MS) {
      alert("Pick-up time must be in the future (not past date/time).");
      return;
    }

    setLoading(true);
    try {
      // ✅ seatsTotal NOT sent (server will set from driver registration)
      await api.post("/api/offers", {
        origin: { point: { lat: from.lat, lng: from.lng }, address: from.label },
        destination: { point: { lat: to.lat, lng: to.lng }, address: to.label },
        pickupTime,
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

              {/* map click toggle buttons */}
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

              <div>
                <label className="block text-sm text-white/70 mb-2">Pick-up time</label>
                <input
                  type="datetime-local"
                  value={pickupTime}
                  min={minPickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                />
              </div>

              {/* ✅ Seats (read-only from vehicle registration) */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Seats (from your vehicle)</label>
                <input
                  type="text"
                  readOnly
                  value={vehicleSeats ? String(vehicleSeats) : "Not set"}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 opacity-80"
                />
                {!vehicleSeats ? (
                  <div className="mt-2 text-xs text-red-300">
                    Submit driver registration first to set vehicle seats.
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Price (LKR)</label>
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
                disabled={loading || !vehicleSeats}
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