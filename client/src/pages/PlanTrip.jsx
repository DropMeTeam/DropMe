import { useMemo, useRef, useState } from "react";
import { useAuth } from "../state/AuthContext";
import PlaceInput from "../components/PlaceInput";
import MapPicker from "../components/MapPicker";
import { getRoute } from "../lib/osrm";
import { api } from "../lib/api";
import { startLiveLocation, stopLiveLocation } from "../lib/geolocate";
import { reverseGeocode } from "../lib/reverseGeocode";
import { useNavigate } from "react-router-dom"; // ✅ ADD

export default function PlanTrip() {
  const { user } = useAuth();
  const nav = useNavigate(); // ✅ ADD

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

  // GPS
  const [myLoc, setMyLoc] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [tracking, setTracking] = useState(false);
  const watchIdRef = useRef(null);

  // Fly-to
  const [flyToKey, setFlyToKey] = useState(0);
  const [flyToTarget, setFlyToTarget] = useState(null);
  const flewRef = useRef(false);

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
      alert(e?.response?.data?.message || "Failed to find matches");
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
      <div className="mx-auto max-w-6xl px-6 py-8 grid grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold">Plan your DropMe Journey</h1>
                <p className="text-sm text-white/60 mt-1">
                  Type or click on map to select points + live location.
                </p>
              </div>
              <div className="text-xs text-white/50 mt-1">
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
                    className="rounded-xl bg-white text-black px-4 py-3 text-sm font-semibold hover:opacity-90"
                  >
                    Start live
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopTracking}
                    className="rounded-xl border border-red-400/30 bg-red-500/10 text-red-200 px-4 py-3 text-sm font-semibold hover:bg-red-500/15"
                  >
                    Stop live
                  </button>
                )}
              </div>

              {gpsError && <div className="text-xs text-red-300">{gpsError}</div>}

              <PlaceInput
                label="Drop-off"
                placeholder="Type drop-off location"
                valueLabel={dropoffText}
                onValueLabelChange={setDropoffText}
                onSelect={(d) => {
                  setDropoff(d);
                  setDropoffText(d.label);
                  if (pickup) buildRoute(pickup, d);
                }}
              />

              <div className="grid grid-cols-2 gap-2">
                <button
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

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "pool", title: "Pool", desc: "Share ride" },
                  { id: "private", title: "Private", desc: "Solo ride" },
                  { id: "transit", title: "Transit", desc: "Public" },
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
                    min={minPickupTime}
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
                    onChange={(e) => setSeats(Number(e.target.value))}
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

        {/* RIGHT */}
        <div className="col-span-12 lg:col-span-8">
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

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Available rides on this route</div>
              <div className="text-xs text-white/60">{offers?.length || 0} offers</div>
            </div>

            {offersMsg ? <div className="mt-2 text-xs text-white/60">{offersMsg}</div> : null}

            {!offers?.length ? null : (
              <div className="mt-3 grid gap-3">
                {offers.map((o) => {
                  const ll = offerLatLng(o);
                  const vehicle = o?.vehicleSnapshot || {};
                  const driver = o?.driverSnapshot || {};

                  const seatsToBook = Number(seats) || 1;
                  const available = Number(o?.seatsAvailable ?? 0);
                  const isOpen = o?.status === "open";
                  const canBook = isOpen && available >= seatsToBook && seatsToBook >= 1;

                  return (
                    <div key={o._id} className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-black/25 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{driver?.name || "Driver"}</div>
                          <div className="text-xs text-white/60">
                            {o?.origin?.address || "Origin"} → {o?.destination?.address || "Destination"}
                          </div>
                          <div className="text-xs text-white/60 mt-1">
                            Pickup: {o?.pickupTime ? new Date(o.pickupTime).toLocaleString() : "—"}
                          </div>
                          {ll ? (
                            <div className="text-[11px] text-white/50 mt-1">
                              Offer pin: {ll.lat.toFixed(5)}, {ll.lng.toFixed(5)}
                            </div>
                          ) : null}
                          <div className="mt-3 text-xs text-white/70">
                            Vehicle: {vehicle?.type || "—"} • {vehicle?.number || "—"} • {vehicle?.color || "—"}
                          </div>
                        </div>

                        <div className="text-right text-xs text-white/70">
                          <div>Seats: {o?.seatsAvailable}/{o?.seatsTotal}</div>
                          <div>{o?.priceLkr ? `LKR ${o.priceLkr}` : "—"}</div>

                          {/* ✅ redirect to checkout */}
                          <button
                            type="button"
                            disabled={!canBook}
                            onClick={() => nav(`/checkout/${o._id}?seats=${seatsToBook}`)}
                            className={
                              "mt-3 rounded-xl px-3 py-2 text-sm font-semibold transition " +
                              (canBook ? "bg-white text-black hover:opacity-90" : "bg-white/10 text-white/40 cursor-not-allowed")
                            }
                          >
                            Proceed
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
  );
}