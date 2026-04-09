import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PlaceInput from "../../components/PlaceInput";
import MapPicker from "../../components/MapPicker";
import { getRoute } from "../../lib/osrm";
import api from "../../lib/api";

export default function OfferRide() {
  // --- LOGIC (UNTOUCHED) ---
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [activePin, setActivePin] = useState("pickup");
  const [routePoints, setRoutePoints] = useState([]);
  const [meta, setMeta] = useState(null);
  const [pickupTime, setPickupTime] = useState("");
  const [priceLkr, setPriceLkr] = useState(0);
  const [loading, setLoading] = useState(false);

  const { data: regData } = useQuery({
    queryKey: ["driver-registration-me"],
    queryFn: async () => (await api.get("/api/driver-registration/me")).data,
  });

  const vehicleSeats = Number(regData?.driverRegistration?.vehicle?.seatsTotal || 0);
  const FUTURE_BUFFER_MS = 60 * 1000;

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
      await api.post("/api/offers", {
        origin: { point: { lat: from.lat, lng: from.lng }, address: from.label },
        destination: { point: { lat: to.lat, lng: to.lng }, address: to.label },
        pickupTime,
        priceLkr: Number(priceLkr),
        routePolyline: meta?.polyline || "",
      });
      alert("Ride offer published!");
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

  // --- UI IMPROVEMENTS ---
  return (
    <div className="min-h-screen bg-[#02040a] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#060812] to-[#060812] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Publish a Ride
          </h1>
          <p className="text-gray-400 mt-2">Fill in the details to share your journey and save costs.</p>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* LEFT PANEL */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
              <div className="relative z-10 space-y-6">
                
                {/* Location Inputs Group */}
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute left-[-18px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-blue-500 to-emerald-500 hidden sm:block" />
                    <div className="space-y-6">
                      <PlaceInput
                        label="From"
                        placeholder="Where are you starting?"
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
                        label="To"
                        placeholder="Where are you going?"
                        valueLabel={toText}
                        onValueLabelChange={setToText}
                        onSelect={(d) => {
                          setTo(d);
                          setToText(d.label);
                          if (from) buildRoute(from, d);
                        }}
                      />
                    </div>
                  </div>

                  {/* Map Toggle Switch - Styled like Segmented Control */}
                  <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => setActivePin("pickup")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-all duration-200 rounded-xl ${
                        activePin === "pickup" ? "bg-white/10 text-white shadow-lg ring-1 ring-white/20" : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Set Pickup
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePin("dropoff")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-all duration-200 rounded-xl ${
                        activePin === "dropoff" ? "bg-white/10 text-white shadow-lg ring-1 ring-white/20" : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                      Set Dropoff
                    </button>
                  </div>
                </div>

                <hr className="border-white/5" />

                {/* Details Group */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1 mb-2 block">Departure Time</label>
                    <input
                      type="datetime-local"
                      value={pickupTime}
                      min={minPickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1 mb-2 block">Available Seats</label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={vehicleSeats ? vehicleSeats : "N/A"}
                        className="w-full rounded-2xl bg-white/5 border border-white/5 px-4 py-3 text-gray-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1 mb-2 block">Price (LKR)</label>
                    <input
                      type="number"
                      min="0"
                      value={priceLkr}
                      onChange={(e) => setPriceLkr(e.target.value)}
                      className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                  </div>
                </div>

                {!vehicleSeats && (
                  <div className="flex items-start gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-200/80">
                    <svg className="w-5 h-5 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <p>Driver registration required. Please complete your profile to set vehicle capacity.</p>
                  </div>
                )}

                <button
                  onClick={submit}
                  disabled={loading || !vehicleSeats}
                  className="group relative w-full overflow-hidden rounded-2xl bg-white px-6 py-4 text-black font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-emerald-400 opacity-0 group-hover:opacity-10 transition-opacity" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-black" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : "Publish Ride Offer"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT MAP */}
          <div className="col-span-12 lg:col-span-8 min-h-[500px] lg:min-h-full">
            <div className="h-full w-full rounded-3xl border border-white/10 bg-white/5 p-2 shadow-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
      </div>
    </div>
  );
}