import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PlaceInput from "../../components/PlaceInput";
import MapPicker from "../../components/MapPicker";
import { getRoute } from "../../lib/osrm";
import api from "../../lib/api";

export default function EditOffer() {
  const { id } = useParams();
  const nav = useNavigate();

  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");

  const [activePin, setActivePin] = useState("pickup");

  const [routePoints, setRoutePoints] = useState([]);
  const [meta, setMeta] = useState(null);

  const [pickupTime, setPickupTime] = useState("");
  const [seatsTotal, setSeatsTotal] = useState(3);
  const [priceLkr, setPriceLkr] = useState(0);
  const [status, setStatus] = useState("open");

  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);

  async function buildRoute(p, d) {
    if (!p || !d) return;
    const r = await getRoute(p, d);
    setRoutePoints(r.pathLatLng);
    setMeta(r);
  }

  function toDatetimeLocalString(dateInput) {
    const d = new Date(dateInput);
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  useEffect(() => {
    (async () => {
      try {
        setBooting(true);
        const { data } = await api.get(`/api/offers/${id}`);
        const o = data?.offer;

        const fromPoint = o?.origin?.point?.coordinates;
        const toPoint = o?.destination?.point?.coordinates;

        const fromObj =
          fromPoint?.length === 2
            ? { label: o?.origin?.address || "Pickup", lat: fromPoint[1], lng: fromPoint[0] }
            : null;

        const toObj =
          toPoint?.length === 2
            ? { label: o?.destination?.address || "Dropoff", lat: toPoint[1], lng: toPoint[0] }
            : null;

        setFrom(fromObj);
        setTo(toObj);
        setFromText(fromObj?.label || "");
        setToText(toObj?.label || "");

        setPickupTime(o?.pickupTime ? toDatetimeLocalString(o.pickupTime) : "");
        setSeatsTotal(o?.seatsTotal ?? 3);
        setPriceLkr(o?.priceLkr ?? 0);
        setStatus(o?.status || "open");

        if (fromObj && toObj) await buildRoute(fromObj, toObj);
      } catch (e) {
        alert(e?.response?.data?.message || "Failed to load offer");
        nav("/driver");
      } finally {
        setBooting(false);
      }
    })();
  }, [id]);

  async function save() {
    if (!from || !to || !pickupTime) {
      alert("Pickup, Drop-off and pickup time are required.");
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/api/offers/${id}`, {
        origin: { point: { lat: from.lat, lng: from.lng }, address: from.label },
        destination: { point: { lat: to.lat, lng: to.lng }, address: to.label },
        pickupTime,
        seatsTotal: Number(seatsTotal),
        priceLkr: Number(priceLkr),
        status,
        routePolyline: meta?.polyline || "",
      });

      alert("Offer updated!");
      nav("/driver");
    } catch (e) {
      alert(e?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    const ok = window.confirm("Delete this offer?");
    if (!ok) return;

    try {
      await api.delete(`/api/offers/${id}`);
      alert("Offer deleted");
      nav("/driver");
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    }
  }

  if (booting) {
    return (
      <div className="min-h-screen bg-[#060812] text-white grid place-items-center">
        <div className="text-sm text-white/70">Loading offer…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060812] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8 grid grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h1 className="text-xl font-semibold">Edit Offer</h1>

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
                <label className="block text-sm text-white/70 mb-2">Price (LKR)</label>
                <input
                  type="number"
                  min="0"
                  value={priceLkr}
                  onChange={(e) => setPriceLkr(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                >
                  <option value="open">open</option>
                  <option value="closed">closed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={loading}
                  className="w-full rounded-xl bg-white text-black font-semibold py-3 disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save changes"}
                </button>

                <button
                  type="button"
                  onClick={() => nav("/driver")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 font-semibold py-3 hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>

              <button
                type="button"
                onClick={remove}
                className="w-full rounded-xl border border-red-400/30 bg-red-500/10 text-red-200 font-semibold py-3 hover:bg-red-500/15"
              >
                Delete offer
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