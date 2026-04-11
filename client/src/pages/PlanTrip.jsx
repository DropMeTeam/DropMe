import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import PlaceInput from "../components/PlaceInput";
import MapPicker from "../components/MapPicker";
import { getRoute } from "../lib/osrm";
import { api } from "../lib/api";
import { startLiveLocation, stopLiveLocation } from "../lib/geolocate";
import { reverseGeocode } from "../lib/reverseGeocode";

export default function PlanTrip() {
  const { user } = useAuth();
  const nav = useNavigate();

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

  const [offers, setOffers] = useState([]);
  const [offersMsg, setOffersMsg] = useState("");

  const [myLoc, setMyLoc] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [tracking, setTracking] = useState(false);
  const watchIdRef = useRef(null);

  const [flyToKey, setFlyToKey] = useState(0);
  const [flyToTarget, setFlyToTarget] = useState(null);
  const flewRef = useRef(false);

  const FUTURE_BUFFER_MS = 60 * 1000;

  const API_ORIGIN = useMemo(() => {
    const b = api?.defaults?.baseURL;

    if (typeof b === "string" && b.startsWith("http")) {
      return b.replace(/\/api\/?$/, "").replace(/\/$/, "");
    }

    return (import.meta.env.VITE_API_ORIGIN || "http://localhost:5000").replace(/\/$/, "");
  }, []);

  function absUrl(url) {
    if (!url || typeof url !== "string") return "";
    if (/^https?:\/\//i.test(url)) return url;
    return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  function getVehicleImageUrl(offer) {
    const raw =
      offer?.vehicleSnapshot?.imageUrl ||
      offer?.vehicleSnapshot?.photoUrl ||
      offer?.vehicleSnapshot?.image ||
      offer?.vehicleSnapshot?.vehicleImage ||
      offer?.vehicleSnapshot?.photos?.[0] ||
      offer?.vehicle?.imageUrl ||
      offer?.vehicle?.photoUrl ||
      offer?.vehicle?.image ||
      offer?.vehicle?.vehicleImage ||
      offer?.driverVehicle?.imageUrl ||
      offer?.driverVehicle?.photoUrl ||
      offer?.driverVehicle?.image ||
      "";

    return absUrl(raw);
  }

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

  const distanceKm = useMemo(() => {
    const meters = Number(meta?.distanceMeters || 0);
    if (!Number.isFinite(meters) || meters <= 0) return 0;
    return Number((meters / 1000).toFixed(1));
  }, [meta]);

  function parsePickupTime(value) {
    const dt = new Date(value);
    if (!value || Number.isNaN(dt.getTime())) return null;
    return dt;
  }

  function ensureFuturePickupTimeOrThrow() {
    const dt = parsePickupTime(pickupTime);
    if (!dt) return { ok: false, message: "Select a valid pick-up time." };

    const minAllowed = Date.now() + FUTURE_BUFFER_MS;
    if (dt.getTime() < minAllowed) {
      return { ok: false, message: "Pick-up time must be in the future (not past date/time)." };
    }

    return { ok: true };
  }

  async function buildRoute(p, d) {
    if (!p || !d) return;

    const r = await getRoute(p, d);
    setRoutePoints(r.pathLatLng);
    setMeta(r);
  }

  async function setPickupFromCoords(lat, lng, accuracyMeters) {
    const label = await reverseGeocode(lat, lng);
    const p = { label, lat, lng };

    setPickup(p);
    setPickupText(label);
    setActivePin("dropoff");

    setMyLoc({ lat, lng, accuracyMeters });

    setFlyToTarget({ lat, lng });
    setFlyToKey((k) => k + 1);

    if (dropoff) buildRoute(p, dropoff);
  }

  async function useMyLocationOnce() {
    setGpsError("");
    setGpsLoading(true);

    if (!("geolocation" in navigator)) {
      setGpsLoading(false);
      setGpsError("Geolocation not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude, accuracy } = pos.coords;
          setActivePin("pickup");
          await setPickupFromCoords(latitude, longitude, accuracy);
        } catch {
          setGpsError("Failed to resolve your location address.");
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(err?.message || "Location permission denied.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
    );
  }

  function startTracking() {
    setGpsError("");
    setTracking(true);
    setActivePin("pickup");
    flewRef.current = false;

    const watchId = startLiveLocation({
      onUpdate: ({ lat, lng, accuracyMeters }) => {
        setMyLoc({ lat, lng, accuracyMeters });

        setPickup((prev) => ({
          ...(prev || {}),
          lat,
          lng,
          label: prev?.label || "My live location",
        }));
        setPickupText((prev) => prev || "My live location");

        if (!flewRef.current) {
          setFlyToTarget({ lat, lng });
          setFlyToKey((k) => k + 1);
          flewRef.current = true;
        }
      },
      onError: (err) => {
        setGpsError(err?.message || "Live tracking failed.");
        setTracking(false);
      },
      enableHighAccuracy: true,
    });

    watchIdRef.current = watchId;
  }

  function stopTracking() {
    stopLiveLocation(watchIdRef.current);
    watchIdRef.current = null;
    setTracking(false);
    flewRef.current = false;
  }

  async function loadOffersForThisRoute() {
    if (!pickup || !dropoff || !pickupTime) return;

    const tCheck = ensureFuturePickupTimeOrThrow();
    if (!tCheck.ok) {
      setOffers([]);
      setOffersMsg(tCheck.message);
      return;
    }

    setOffersMsg("");

    try {
      const { data } = await api.get("/api/offers/search", {
        params: {
          originLat: pickup.lat,
          originLng: pickup.lng,
          destLat: dropoff.lat,
          destLng: dropoff.lng,
          pickupTime,
          seatsNeeded: Number(seats),
          radiusMeters: 3000,
          timeWindowMins: 30,
        },
      });

      const list = data?.offers || [];
      setOffers(list);
      setOffersMsg(list.length ? "" : "No matching ride offers found for this route/time.");
    } catch (e) {
      setOffers([]);
      setOffersMsg(e?.response?.data?.message || "Offer search failed.");
    }
  }

  async function findMatches() {
    if (!pickup || !dropoff) return alert("Select pickup & drop-off.");
    if (!pickupTime) return alert("Select pickup time.");

    const tCheck = ensureFuturePickupTimeOrThrow();
    if (!tCheck.ok) {
      setOffers([]);
      setOffersMsg(tCheck.message);
      return alert(tCheck.message);
    }

    setLoading(true);
    await loadOffersForThisRoute();

    try {
      await api.post("/api/requests", {
        mode,
        seats: Number(seats),
        pickupTime,
        origin: { lat: pickup.lat, lng: pickup.lng, label: pickup.label },
        destination: { lat: dropoff.lat, lng: dropoff.lng, label: dropoff.label },
        distanceMeters: meta?.distanceMeters ?? null,
        durationSeconds: meta?.durationSeconds ?? null,
      });

      alert("Offers loaded. Choose one and click Book.");
    } catch (e) {
      alert(e?.response?.data?.message || " Select Your vehicle.🚕");
    } finally {
      setLoading(false);
    }
  }

  function offerLatLng(offer) {
    const coords = offer?.origin?.point?.coordinates;
    if (!coords || coords.length !== 2) return null;

    const [lng, lat] = coords;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng };
  }

  return (
    <div className="min-h-screen bg-[#060812] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 space-y-4 lg:col-span-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-semibold">Plan your DropMe Journey</h1>
                  <p className="mt-1 text-sm text-white/60">
                    Type or click on map to select points + live location.
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
                  onSelect={(p) => {
                    setPickup(p);
                    setPickupText(p.label);
                    setActivePin("dropoff");
                    if (dropoff) buildRoute(p, dropoff);
                  }}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={useMyLocationOnce}
                    disabled={gpsLoading}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm hover:bg-white/10 disabled:opacity-60"
                  >
                    {gpsLoading ? "Getting location..." : "Use my location"}
                  </button>

                  {!tracking ? (
                    <button
                      type="button"
                      onClick={startTracking}
                      className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-2.5 text-sm font-medium text-indigo-300 transition-all duration-200 hover:bg-indigo-500/20 hover:text-indigo-200 active:scale-[0.98]"
                    >
                      Start Live
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopTracking}
                      className="relative overflow-hidden rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-2.5 text-sm font-medium text-rose-300 transition-all duration-200 hover:bg-rose-500/20 active:scale-[0.98]"
                    >
                      <span className="absolute inset-0 animate-pulse bg-rose-500/20"></span>
                      <span className="relative z-10">Stop Live</span>
                    </button>
                  )}
                </div>

                {gpsError && (
                  <div className="ml-1 text-xs font-medium text-rose-400">
                    {gpsError}
                  </div>
                )}

                <div className="relative z-0">
                  <div className="absolute -left-3.5 top-0 bottom-0 hidden w-[1px] bg-gradient-to-b from-white/10 via-white/5 to-transparent md:block"></div>
                  <PlaceInput
                    label="Drop-off location"
                    placeholder="Where to?"
                    valueLabel={dropoffText}
                    onValueLabelChange={setDropoffText}
                    onSelect={(d) => {
                      setDropoff(d);
                      setDropoffText(d.label);
                      if (pickup) buildRoute(pickup, d);
                    }}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setActivePin("pickup")}
                    className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                      activePin === "pickup"
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                        : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    Set Pickup Pin
                  </button>
                  <button
                    onClick={() => setActivePin("dropoff")}
                    className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                      activePin === "dropoff"
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                        : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    Set Drop Pin
                  </button>
                </div>

                <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">Pick-up time</label>
                    <input
                      type="datetime-local"
                      value={pickupTime}
                      min={minPickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all hover:bg-white/[0.06] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">Seats needed</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={seats}
                      onChange={(e) => setSeats(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all hover:bg-white/[0.06] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                {meta && (
                  <div className="animate-in slide-in-from-bottom-2 fade-in rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-4 text-sm backdrop-blur-sm duration-300">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white/50">Estimated Distance</span>
                      <span className="font-semibold text-white/90">{distanceKm.toFixed(1)} km</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="font-medium text-white/50">Estimated Time</span>
                      <span className="font-semibold text-white/90">
                        {Math.round(meta.durationSeconds / 60)} min
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={findMatches}
                  disabled={loading}
                  className="group relative mt-4 w-full overflow-hidden rounded-2xl bg-white py-4 text-sm font-bold tracking-wide text-black transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="relative z-10">{loading ? "Scanning Network..." : "Find Available Rides"}</span>
                  <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-[100%]"></div>
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
            <div className="relative h-[400px] overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] shadow-2xl lg:h-[500px]">
              <MapPicker
                pickup={pickup}
                dropoff={dropoff}
                myLoc={myLoc}
                active={activePin}
                routePoints={routePoints}
                flyTo={flyToTarget}
                flyToKey={flyToKey}
                flyZoom={16}
                offers={offers}
                onChangePickup={(p) => {
                  setPickup(p);
                  setPickupText(p.label);
                  setActivePin("dropoff");
                  if (dropoff) buildRoute(p, dropoff);
                }}
                onChangeDropoff={(d) => {
                  setDropoff(d);
                  setDropoffText(d.label);
                  if (pickup) buildRoute(pickup, d);
                }}
              />
            </div>

            <div className="relative rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="text-lg font-semibold tracking-tight">Available Rides</div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
                  {offers?.length || 0} found
                </div>
              </div>

              {offersMsg && (
                <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-center text-sm text-white/60">
                  {offersMsg}
                </div>
              )}

              {!offers?.length ? null : (
                <div className="grid gap-4">
                  {offers.map((o) => {
                    const ll = offerLatLng(o);
                    const vehicle = o?.vehicleSnapshot || {};
                    const driver = o?.driverSnapshot || {};
                    const vehicleImage = getVehicleImageUrl(o);

                    const seatsToBook = Number(seats) || 1;
                    const available = Number(o?.seatsAvailable ?? 0);
                    const isOpen = o?.status === "open";
                    const canBook = isOpen && available >= seatsToBook && seatsToBook >= 1;

                    return (
                      <div
                        key={o._id}
                        className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04] hover:shadow-xl"
                      >
                        <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 transition-opacity group-hover:opacity-100"></div>

                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 font-bold text-indigo-200">
                                {driver?.name?.charAt(0) || "D"}
                              </div>

                              <div className="min-w-0">
                                <div className="font-semibold text-white/90">{driver?.name || "Driver"}</div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                                  <span>★ 4.9</span>
                                  <span>•</span>
                                  <span>
                                    {vehicle?.color || "Color"} {vehicle?.type || "Car"}
                                  </span>
                                  <span className="ml-1 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] uppercase">
                                    {vehicle?.number || "NO-PLATE"}
                                  </span>
                                </div>
                              </div>

                              {vehicleImage ? (
                                <div className="ml-auto h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                  <img
                                    src={vehicleImage}
                                    alt={vehicle?.type || "Vehicle"}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                              ) : null}
                            </div>

                            <div className="mt-4 space-y-2">
                              <div className="flex items-start gap-3">
                                <div className="mt-1 h-2 w-2 shrink-0 rounded-full border border-white/50 bg-white/30 shadow-[0_0_5px_rgba(255,255,255,0.3)]"></div>
                                <div className="line-clamp-1 text-sm text-white/70">{o?.origin?.address || "Origin"}</div>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="mt-1 h-2 w-2 shrink-0 rounded-full border border-indigo-300 bg-indigo-400 shadow-[0_0_5px_rgba(129,140,248,0.5)]"></div>
                                <div className="line-clamp-1 text-sm text-white/70">
                                  {o?.destination?.address || "Destination"}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium">
                              <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-white/50">
                                ⏰{" "}
                                {o?.pickupTime
                                  ? new Date(o.pickupTime).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "—"}
                              </div>
                              {ll && (
                                <div className="flex items-center gap-1.5 text-white/40">
                                  📍 {ll.lat.toFixed(4)}, {ll.lng.toFixed(4)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="min-w-[140px] flex-row items-center justify-between border-t border-white/5 pt-4 md:flex md:flex-col md:items-end md:justify-center md:border-l md:border-t-0 md:pl-6 md:pt-0">
                            <div className="text-left md:text-right">
                              <div className="mb-1 text-xs font-medium text-white/50">Price per seat</div>
                              <div className="text-xl font-bold tracking-tight text-white">
                                {o?.priceLkr ? `LKR ${o.priceLkr}` : "Free"}
                              </div>
                              <div className="mt-1 text-xs font-medium">
                                <span className={available >= seatsToBook ? "text-emerald-400" : "text-rose-400"}>
                                  {available} seats left
                                </span>
                                <span className="text-white/30"> / {o?.seatsTotal}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={!canBook}
                              onClick={() => nav(`/checkout/${o._id}?seats=${seatsToBook}&distanceKm=${distanceKm}`)}
                              className={`mt-0 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-300 md:mt-4 ${
                                canBook
                                  ? "bg-white text-black hover:scale-[1.03] hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] active:scale-[0.97]"
                                  : "cursor-not-allowed border border-white/5 bg-white/5 text-white/30"
                              }`}
                            >
                              {canBook ? "Book Ride" : "Full"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
