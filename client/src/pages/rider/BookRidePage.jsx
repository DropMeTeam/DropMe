import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";

function normalizeVehicleType(t) {
  const s = String(t || "").toLowerCase().trim();
  if (s.includes("suv")) return "suv";
  if (s.includes("van")) return "van"; // covers "mini van" too
  if (s.includes("car")) return "car"; // covers "mini car" too
  return "car";
}

function VehicleIcon({ type }) {
  const base = normalizeVehicleType(type);

  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };

  if (base === "van") {
    return (
      <svg {...common}>
        <path
          d="M3 16V9.5C3 8.12 4.12 7 5.5 7H14.5C15.88 7 17 8.12 17 9.5V16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M17 10H19.2C20.19 10 21 10.81 21 11.8V16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M6.5 16.5C6.5 17.6 5.6 18.5 4.5 18.5C3.4 18.5 2.5 17.6 2.5 16.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M19.5 16.5C19.5 17.6 18.6 18.5 17.5 18.5C16.4 18.5 15.5 17.6 15.5 16.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M7 10H13"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (base === "suv") {
    return (
      <svg {...common}>
        <path
          d="M4 14.5L5.3 10.9C5.7 9.8 6.75 9 7.95 9H15.6C16.6 9 17.5 9.6 17.9 10.5L19.5 14.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M3.5 14.5H20.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M6.5 14.5C6.5 15.6 5.6 16.5 4.5 16.5C3.4 16.5 2.5 15.6 2.5 14.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M21.5 14.5C21.5 15.6 20.6 16.5 19.5 16.5C18.4 16.5 17.5 15.6 17.5 14.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M7 11.2H15.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // default: car
  return (
    <svg {...common}>
      <path
        d="M5 13.8L6.2 10.7C6.6 9.6 7.65 8.9 8.8 8.9H15.2C16.35 8.9 17.4 9.6 17.8 10.7L19 13.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4 13.8H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 13.8C7 14.9 6.1 15.8 5 15.8C3.9 15.8 3 14.9 3 13.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M21 13.8C21 14.9 20.1 15.8 19 15.8C17.9 15.8 17 14.9 17 13.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 11.3H16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function chipClass(kind) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border";
  if (kind === "open") return `${base} border-emerald-400/40 bg-emerald-500/10 text-emerald-200`;
  if (kind === "closed") return `${base} border-zinc-700 bg-zinc-950/30 text-zinc-300`;
  if (kind === "completed") return `${base} border-sky-400/40 bg-sky-500/10 text-sky-200`;
  return `${base} border-zinc-700 bg-zinc-950/30 text-zinc-300`;
}

export default function BookRidePage() {
  const { offerId } = useParams();
  const nav = useNavigate();

  const [offer, setOffer] = useState(null);
  const [seatsBooked, setSeatsBooked] = useState(1);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setBooting(true);
        const { data } = await api.get(`/api/offers/public/${offerId}`);
        setOffer(data?.offer || null);
      } catch (e) {
        setOffer(null);
        setMsg(e?.response?.data?.message || "Failed to load offer");
      } finally {
        setBooting(false);
      }
    })();
  }, [offerId]);

  const maxSeats = useMemo(() => {
    const available = Number(offer?.seatsAvailable || 0);
    return Math.max(1, Math.min(6, available));
  }, [offer?.seatsAvailable]);

  const isPast = useMemo(() => {
    const t = offer?.pickupTime ? new Date(offer.pickupTime).getTime() : 0;
    return t > 0 && t < Date.now();
  }, [offer?.pickupTime]);

  const driver = offer?.driverSnapshot || {};
  const vehicle = offer?.vehicleSnapshot || {};
  const vehicleTypeRaw = vehicle?.type || "";
  const vehicleTypeNormalized = normalizeVehicleType(vehicleTypeRaw);

  const estTotal = useMemo(() => {
    // assume priceLkr is per seat (common for pool rides)
    const p = Number(offer?.priceLkr || 0);
    const s = Number(seatsBooked || 0);
    if (!p || !s) return 0;
    return p * s;
  }, [offer?.priceLkr, seatsBooked]);

  async function confirmBooking() {
    setMsg("");

    if (!offer) return;
    if (offer.status !== "open") return setMsg("This offer is not open for booking.");
    if (isPast) return setMsg("Cannot book a past ride.");

    setLoading(true);
    try {
      await api.post("/api/bookings", {
        offerId: offer._id,
        seatsBooked: Number(seatsBooked),
      });

      alert("Booking confirmed ✅");
      nav("/rider");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  if (booting) {
    return (
      <div className="min-h-screen bg-[#060812] text-white grid place-items-center">
        <div className="text-sm text-white/70">Loading booking…</div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-[#060812] text-white grid place-items-center">
        <div className="text-sm text-red-300">{msg || "Offer not found"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060812] text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold">Confirm Booking</div>
            <div className="text-sm text-white/60 mt-1">
              Select seats and confirm your booking with the chosen driver and vehicle.
            </div>
          </div>
          <span className={chipClass(offer.status)}>{offer.status}</span>
        </div>

        {msg ? (
          <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 text-red-200 p-4 text-sm">
            {msg}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-12 gap-6">
          {/* Left: Driver + Vehicle */}
          <div className="col-span-12 lg:col-span-7 space-y-4">
            {/* Driver Card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl overflow-hidden border border-white/10 bg-black/20 grid place-items-center">
                  {driver?.avatarUrl ? (
                    <img src={driver.avatarUrl} alt="driver" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-sm font-semibold text-white/70">
                      {(driver?.name || "D").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="text-lg font-semibold">{driver?.name || "Driver"}</div>
                  <div className="text-xs text-white/60 mt-1">
                    Pickup: {offer?.pickupTime ? new Date(offer.pickupTime).toLocaleString() : "—"}
                  </div>
                </div>

                {isPast ? (
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border border-yellow-400/40 bg-yellow-500/10 text-yellow-200">
                    Past ride (booking disabled)
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid gap-2">
                <div className="text-sm text-white/80">
                  <span className="text-white/50">Route:</span>{" "}
                  {offer?.origin?.address || "Origin"}{" "}
                  <span className="text-white/40">→</span>{" "}
                  {offer?.destination?.address || "Destination"}
                </div>

                <div className="text-sm text-white/80">
                  <span className="text-white/50">Seats:</span>{" "}
                  {offer?.seatsAvailable}/{offer?.seatsTotal} available
                </div>
              </div>
            </div>

            {/* Vehicle Card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl border border-white/10 bg-black/20 grid place-items-center text-white">
                    <VehicleIcon type={vehicleTypeRaw} />
                  </div>

                  <div>
                    <div className="text-sm font-semibold">
                      {vehicleTypeRaw || "Vehicle"}
                      {String(vehicleTypeRaw).toLowerCase().includes("mini") ? (
                        <span className="ml-2 text-[11px] text-white/60">(mini)</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {vehicle?.number ? `Number: ${vehicle.number}` : "Number: —"} •{" "}
                      {vehicle?.color ? `Color: ${vehicle.color}` : "Color: —"}
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border border-white/10 bg-white/5 text-white/70">
                  {vehicleTypeNormalized.toUpperCase()}
                </span>
              </div>

              {vehicle?.photoUrl ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <img
                    src={vehicle.photoUrl}
                    alt="vehicle"
                    className="w-full h-44 object-cover"
                  />
                </div>
              ) : null}

              <div className="mt-4 text-sm text-white/80">
                <span className="text-white/50">Price:</span>{" "}
                {offer?.priceLkr ? `LKR ${offer.priceLkr} (per seat)` : "—"}
              </div>
            </div>
          </div>

          {/* Right: Booking Summary */}
          <div className="col-span-12 lg:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sticky top-6">
              <div className="text-lg font-semibold">Booking Summary</div>
              <div className="text-sm text-white/60 mt-1">Confirm seat count and finalize.</div>

              <div className="mt-5">
                <label className="block text-sm text-white/70 mb-2">Seats to book</label>
                <input
                  type="number"
                  min="1"
                  max={maxSeats}
                  value={seatsBooked}
                  onChange={(e) => setSeatsBooked(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                />
                <div className="text-[11px] text-white/50 mt-1">
                  Max seats you can book now: {maxSeats}
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Seats</span>
                  <span>{Number(seatsBooked) || 1}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-white/60">Price per seat</span>
                  <span>{offer?.priceLkr ? `LKR ${offer.priceLkr}` : "—"}</span>
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-white/10">
                  <span className="font-semibold">Estimated total</span>
                  <span className="font-semibold">{estTotal ? `LKR ${estTotal}` : "—"}</span>
                </div>
                <div className="text-[11px] text-white/50 mt-2">
                  Total is an estimate (based on per-seat price).
                </div>
              </div>

              <button
                onClick={confirmBooking}
                disabled={loading || offer.status !== "open" || isPast}
                className="mt-5 w-full rounded-xl bg-white text-black font-semibold py-3 disabled:opacity-60"
              >
                {loading ? "Booking..." : "Confirm Booking"}
              </button>

              <button
                type="button"
                onClick={() => nav(-1)}
                className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 font-semibold py-3 hover:bg-white/10"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}