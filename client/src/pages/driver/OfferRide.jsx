import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Calendar, Users, Banknote, Navigation, ArrowRight, Info, Loader2 } from "lucide-react";
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
    <div className="min-h-screen bg-[#05070a] text-slate-200 selection:bg-indigo-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-6 py-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
              <Navigation className="w-3 h-3" /> Driver Console
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Publish  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">The Ride</span>
            </h1>
            <p className="text-slate-400 mt-3 text-lg max-w-2xl">
              Share your route, reduce your carbon footprint, and earn while you drive.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* LEFT PANEL - FORM */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div className="rounded-[2.5rem] border border-white/10 bg-[#0c0f17]/80 backdrop-blur-2xl p-8 shadow-2xl ring-1 ring-white/5">
              <div className="space-y-8">
                
                {/* Route Section */}
                <div className="relative space-y-4">
                  <div className="absolute left-6 top-[3.5rem] bottom-14 w-[2px] bg-gradient-to-b from-indigo-500 via-slate-700 to-emerald-500" />
                  
                  <div className="relative z-10 flex gap-4">
                    <div className="mt-10 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                    <div className="flex-1">
                      <PlaceInput
                        label="Pickup Point"
                        placeholder="Search starting city..."
                        valueLabel={fromText}
                        onValueLabelChange={setFromText}
                        onSelect={(p) => {
                          setFrom(p);
                          setFromText(p.label);
                          setActivePin("dropoff");
                          if (to) buildRoute(p, to);
                        }}
                      />
                    </div>
                  </div>

                  <div className="relative z-10 flex gap-4">
                    <div className="mt-10 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                    <div className="flex-1">
                      <PlaceInput
                        label="Destination"
                        placeholder="Where to?"
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
                </div>

                {/* Map Focus Toggles */}
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setActivePin("pickup")}
                    className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all duration-300 rounded-xl ${
                      activePin === "pickup" 
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                        : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <MapPin className="w-4 h-4" /> Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePin("dropoff")}
                    className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all duration-300 rounded-xl ${
                      activePin === "dropoff" 
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                        : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <Navigation className="w-4 h-4" /> Dropoff
                  </button>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Journey Details */}
                <div className="space-y-5">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 ml-1">
                      <Calendar className="w-3.5 h-3.5" /> Departure Time
                    </label>
                    <input
                      type="datetime-local"
                      value={pickupTime}
                      min={minPickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full rounded-2xl bg-black/40 border border-white/10 px-5 py-4 text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 ml-1">
                        <Users className="w-3.5 h-3.5" /> Seats
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={vehicleSeats ? `${vehicleSeats} Available` : "N/A"}
                        className="w-full rounded-2xl bg-white/5 border border-white/5 px-5 py-4 text-slate-400 cursor-not-allowed font-medium"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 ml-1">
                        <Banknote className="w-3.5 h-3.5" /> Price (LKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={priceLkr}
                        onChange={(e) => setPriceLkr(e.target.value)}
                        className="w-full rounded-2xl bg-black/40 border border-white/10 px-5 py-4 text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Status/Validation Messages */}
                {!vehicleSeats && (
                  <div className="flex items-start gap-4 rounded-3xl bg-amber-500/5 border border-amber-500/20 p-5 group animate-pulse">
                    <Info className="w-6 h-6 text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-amber-200/70 leading-relaxed">
                      Vehicle not verified. <span className="text-amber-400 font-semibold cursor-pointer underline underline-offset-4">Register as a driver</span> to publish offers.
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={submit}
                  disabled={loading || !vehicleSeats}
                  className="group relative w-full overflow-hidden rounded-2xl bg-white py-5 text-black font-extrabold transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                  <span className="relative flex items-center justify-center gap-3 text-lg">
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        Publish Ride Offer <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - MAP */}
          <div className="col-span-12 lg:col-span-8 min-h-[600px] lg:min-h-full">
            <div className="sticky top-10 h-[calc(100vh-140px)] w-full rounded-[2.5rem] border border-white/10 bg-[#0c0f17] p-3 shadow-2xl overflow-hidden group">
              {/* Map Interface Overlay */}
              <div className="absolute top-8 left-8 z-20 pointer-events-none">
                {meta?.distance && (
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl space-y-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Estimated Distance</p>
                    <p className="text-2xl font-black text-white">{(meta.distance / 1000).toFixed(1)} <span className="text-sm font-normal text-slate-400">km</span></p>
                  </div>
                )}
              </div>
              
              <div className="h-full w-full rounded-[2rem] overflow-hidden grayscale-[0.2] brightness-[0.8] contrast-[1.2] hover:grayscale-0 hover:brightness-100 transition-all duration-700">
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
    </div>
  );
}