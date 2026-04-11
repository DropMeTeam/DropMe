import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  MapPin,
  PlusCircle,
  Route as RouteIcon,
  Trash2,
  Save,
  BusFront,
} from "lucide-react";
import api from "../../lib/api";
import PlaceSearch from "../../components/PlaceSearch";
import { getRoadRoute } from "../../lib/osrm";

// Fix default marker icons (Leaflet + Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function normalizePlace(p) {
  if (!p) return null;

  const latRaw = p.lat;
  const lngRaw = p.lng ?? p.lon;

  const lat = typeof latRaw === "string" ? Number(latRaw) : latRaw;
  const lng = typeof lngRaw === "string" ? Number(lngRaw) : lngRaw;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    ...p,
    lat,
    lng,
  };
}

function StatMiniCard({ title, value, valueClass = "text-white" }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </p>
      <div className={`mt-3 text-2xl font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}

function FieldShell({ label, children }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
      <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function EditBusRoute() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [routeNumber, setRouteNumber] = useState("");
  const [routeType, setRouteType] = useState("NORMAL");

  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [stops, setStops] = useState([]);

  const [startQ, setStartQ] = useState("");
  const [endQ, setEndQ] = useState("");
  const [stopQ, setStopQ] = useState("");

  const [roadLine, setRoadLine] = useState([]);
  const [distanceKm, setDistanceKm] = useState(0);

  const center = useMemo(() => {
    const s = normalizePlace(start);
    if (s) return [s.lat, s.lng];
    return [7.8731, 80.7718];
  }, [start]);

  async function load() {
    setLoading(true);
    setMsg(null);

    try {
      const res = await api.get(`/api/bus/routes/${id}`);
      const r = res.data?.route || res.data;

      const s = normalizePlace(r?.start);
      const e = normalizePlace(r?.end);
      const mids = (r?.stops || []).map(normalizePlace).filter(Boolean);

      setRouteNumber(r?.routeNumber || "");
      setRouteType(r?.routeType || "NORMAL");
      setStart(s);
      setEnd(e);
      setStops(mids);
      setDistanceKm(Number(r?.distanceKm || 0));

      setStartQ(s?.label || "");
      setEndQ(e?.label || "");
      setStopQ("");
    } catch (e) {
      setMsg({
        type: "error",
        text: e?.response?.data?.message || e.message || "Failed to load route",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    let alive = true;

    async function buildRoad() {
      try {
        const s = normalizePlace(start);
        const e = normalizePlace(end);
        const mids = (stops || []).map(normalizePlace).filter(Boolean);

        if (!s || !e) {
          if (alive) {
            setRoadLine([]);
            setDistanceKm(0);
          }
          return;
        }

        const points = [s, ...mids, e];
        const result = await getRoadRoute(points);

        if (!alive) return;

        setRoadLine(result?.latlngs || []);
        setDistanceKm(Number(result?.distanceKm || 0));
      } catch {
        if (!alive) return;

        const s = normalizePlace(start);
        const e = normalizePlace(end);
        const mids = (stops || []).map(normalizePlace).filter(Boolean);

        const fallback = [];
        if (s) fallback.push([s.lat, s.lng]);
        for (const m of mids) fallback.push([m.lat, m.lng]);
        if (e) fallback.push([e.lat, e.lng]);

        setRoadLine(fallback);
        setDistanceKm(0);
      }
    }

    buildRoad();

    return () => {
      alive = false;
    };
  }, [start, end, stops]);

  function removeStop(index) {
    setStops((prev) => prev.filter((_, i) => i !== index));
  }

  function moveStop(index, dir) {
    setStops((prev) => {
      const copy = [...prev];
      const ni = index + dir;
      if (ni < 0 || ni >= copy.length) return prev;
      [copy[index], copy[ni]] = [copy[ni], copy[index]];
      return copy;
    });
  }

  async function onSave(e) {
    e.preventDefault();
    setMsg(null);

    const s = normalizePlace(start);
    const ept = normalizePlace(end);
    const mids = (stops || []).map(normalizePlace).filter(Boolean);

    if (!routeNumber.trim()) {
      return setMsg({ type: "error", text: "Route number is required" });
    }

    if (!s) {
      return setMsg({ type: "error", text: "Start point is required" });
    }

    if (!ept) {
      return setMsg({ type: "error", text: "End point is required" });
    }

    const cap = routeType === "EXPRESS" ? 10 : 50;
    if (mids.length > cap) {
      return setMsg({
        type: "error",
        text: `${routeType} cannot exceed ${cap} stops`,
      });
    }

    setSaving(true);

    try {
      const payload = {
        routeNumber: routeNumber.trim(),
        routeType,
        start: s,
        end: ept,
        stops: mids,
        distanceKm,
      };

      await api.patch(`/api/bus/routes/${id}`, payload);
      setMsg({ type: "success", text: "Saved successfully" });
    } catch (e) {
      setMsg({
        type: "error",
        text: e?.response?.data?.message || e.message || "Save failed",
      });
    } finally {
      setSaving(false);
    }
  }

  const sN = normalizePlace(start);
  const eN = normalizePlace(end);
  const midsN = (stops || []).map(normalizePlace).filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080d] px-4 py-5 md:px-6">
        <div className="mx-auto max-w-[1500px] rounded-[30px] border border-white/8 bg-[#090b10] p-8 text-zinc-400 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
          Loading route...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080d] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="rounded-[30px] border border-white/8 bg-[#090b10] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.35)] md:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => nav("/bus/routes")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08]"
                title="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/15 bg-blue-400/10 text-blue-300">
                    <BusFront className="h-6 w-6" />
                  </div>

                  <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                      View / Edit Route
                    </h1>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                      Route Refinement & Service Mapping
                    </p>
                  </div>
                </div>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
                  Update route identity, refine start and end points, reorder intermediate stops,
                  and save the optimized road-based path with recalculated distance.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[430px]">
              <StatMiniCard
                title="Route Type"
                value={routeType}
                valueClass={routeType === "EXPRESS" ? "text-amber-300" : "text-blue-300"}
              />
              <StatMiniCard title="Stops Added" value={stops.length} valueClass="text-white" />
              <StatMiniCard
                title="Distance"
                value={distanceKm > 0 ? `${distanceKm.toFixed(2)} km` : "--"}
                valueClass="text-emerald-300"
              />
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_430px]">
            <form onSubmit={onSave} className="min-w-0 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <FieldShell label="Route Number">
                  <input
                    value={routeNumber}
                    onChange={(e) => setRouteNumber(e.target.value)}
                    placeholder="e.g., 100 or EX-02"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-blue-400/40"
                  />
                </FieldShell>

                <FieldShell label="Route Type">
                  <select
                    value={routeType}
                    onChange={(e) => setRouteType(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none transition focus:border-blue-400/40"
                  >
                    <option value="NORMAL" className="bg-[#10131a]">
                      NORMAL
                    </option>
                    <option value="EXPRESS" className="bg-[#10131a]">
                      EXPRESS
                    </option>
                  </select>
                </FieldShell>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FieldShell label="Start Point">
                  <PlaceSearch
                    label="Update Start"
                    value={startQ}
                    onValueChange={setStartQ}
                    onSelect={(p) => {
                      const n = normalizePlace(p);
                      setStart(n);
                      setStartQ(n?.label || "");
                    }}
                  />

                  {start ? (
                    <div className="mt-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                      <span className="font-semibold">Start:</span> {start.label}
                    </div>
                  ) : null}
                </FieldShell>

                <FieldShell label="End Point">
                  <PlaceSearch
                    label="Update End"
                    value={endQ}
                    onValueChange={setEndQ}
                    onSelect={(p) => {
                      const n = normalizePlace(p);
                      setEnd(n);
                      setEndQ(n?.label || "");
                    }}
                  />

                  {end ? (
                    <div className="mt-3 rounded-2xl border border-rose-400/15 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                      <span className="font-semibold">End:</span> {end.label}
                    </div>
                  ) : null}
                </FieldShell>
              </div>

              <FieldShell label="Ordered Stops">
                <PlaceSearch
                  label="Add Stop"
                  value={stopQ}
                  onValueChange={setStopQ}
                  onSelect={(p) => {
                    const n = normalizePlace(p);
                    if (!n) return;
                    setStops((prev) => [...prev, n]);
                    setStopQ("");
                  }}
                />

                <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
                  <PlusCircle className="h-4 w-4" />
                  Add stop locations one by one in service order.
                </div>

                {stops.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {stops.map((s, idx) => (
                      <div
                        key={`${s.label}-${idx}`}
                        className="grid gap-4 rounded-[22px] border border-white/8 bg-black/35 p-4 md:grid-cols-[56px_minmax(0,1fr)_auto] md:items-center"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/15 bg-blue-400/10 text-sm font-bold text-blue-300">
                          {idx + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="break-words text-sm font-semibold leading-6 text-white">
                            {s.label}
                          </div>

                          <div className="mt-1 text-xs text-zinc-500">
                            {Number(s.lat).toFixed(5)}, {Number(s.lng ?? s.lon).toFixed(5)}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => moveStop(idx, -1)}
                            disabled={idx === 0}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-200 transition hover:bg-white/[0.08] disabled:opacity-40"
                            title="Move up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => moveStop(idx, +1)}
                            disabled={idx === stops.length - 1}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-200 transition hover:bg-white/[0.08] disabled:opacity-40"
                            title="Move down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeStop(idx)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/15 bg-red-400/10 text-red-300 transition hover:bg-red-400/15"
                            title="Remove stop"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-zinc-500">
                    No stops added yet.
                  </div>
                )}
              </FieldShell>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-emerald-400/15 bg-emerald-400/10 px-5 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                    Auto Calculated Distance
                  </div>
                  <div className="mt-2 text-2xl font-bold text-emerald-200">
                    {distanceKm > 0 ? `${distanceKm.toFixed(2)} km` : "Not calculated yet"}
                  </div>
                </div>

                <div className="rounded-[24px] border border-blue-400/15 bg-blue-400/10 px-5 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300/80">
                    Route Capacity Rule
                  </div>
                  <div className="mt-2 text-sm font-medium text-blue-100">
                    {routeType === "EXPRESS"
                      ? "EXPRESS routes can contain up to 10 stops."
                      : "NORMAL routes can contain up to 50 stops."}
                  </div>
                </div>
              </div>

              {msg ? (
                <div
                  className={[
                    "rounded-[22px] border px-4 py-4 text-sm font-medium",
                    msg.type === "success"
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                      : "border-red-400/20 bg-red-400/10 text-red-200",
                  ].join(" ")}
                >
                  {msg.text}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => nav("/bus/routes")}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#bcd1ff] px-6 text-sm font-semibold text-[#111827] transition hover:brightness-105 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>

            <div className="min-w-0 rounded-[28px] border border-white/8 bg-[#07090d] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">Route Preview Map</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Preview start, stops, end point, and generated road path.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400">
                  <RouteIcon className="h-3.5 w-3.5" />
                  Live Preview
                </div>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    Start
                  </div>
                  <div className="mt-2 truncate text-sm font-semibold text-white">
                    {sN?.label || "-"}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    Stops
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">{midsN.length}</div>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    End
                  </div>
                  <div className="mt-2 truncate text-sm font-semibold text-white">
                    {eN?.label || "-"}
                  </div>
                </div>
              </div>

              <div className="h-[520px] overflow-hidden rounded-[24px] border border-white/8">
                <MapContainer
                  center={center}
                  zoom={sN ? 10 : 8}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {sN ? (
                    <Marker position={[sN.lat, sN.lng]}>
                      <Tooltip direction="top" offset={[0, -10]} permanent>
                        <div className="font-semibold">START</div>
                      </Tooltip>
                    </Marker>
                  ) : null}

                  {midsN.map((m, idx) => (
                    <Marker key={`${m.label}-${idx}`} position={[m.lat, m.lng]}>
                      <Tooltip direction="top" offset={[0, -10]} permanent>
                        <div className="font-semibold">{idx + 1}</div>
                      </Tooltip>
                    </Marker>
                  ))}

                  {eN ? (
                    <Marker position={[eN.lat, eN.lng]}>
                      <Tooltip direction="top" offset={[0, -10]} permanent>
                        <div className="font-semibold">END</div>
                      </Tooltip>
                    </Marker>
                  ) : null}

                  {roadLine.length >= 2 ? (
                    <Polyline positions={roadLine} pathOptions={{ weight: 5 }} />
                  ) : null}
                </MapContainer>
              </div>

              <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-zinc-500" />
                  <p className="text-sm leading-6 text-zinc-400">
                    The route line is rebuilt from the updated start point, ordered stops,
                    and end point. When road routing is available, distance is recalculated automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}