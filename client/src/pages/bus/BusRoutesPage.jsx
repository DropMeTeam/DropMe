import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCcw,
  Route as RouteIcon,
  Search,
  Trash2,
} from "lucide-react";
import api from "../../lib/api";

const PAGE_SIZE = 5;

function shortPlace(label = "") {
  if (!label) return "-";
  return String(label).split(",")[0].trim();
}

function normalizeType(type = "") {
  return String(type).trim().toLowerCase();
}

function AnimatedCount({ value, duration = 1100, decimals = 0, suffix = "" }) {
  const [count, setCount] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = Number(value) || 0;

    let frameId;
    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = startValue + (endValue - startValue) * eased;
      setCount(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endValue;
      }
    }

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return (
    <span>
      {decimals > 0 ? count.toFixed(decimals) : Math.round(count)}
      {suffix}
    </span>
  );
}

function StatCard({ title, value, accent = "text-white", decimals = 0, suffix = "" }) {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white/[0.03] to-transparent pointer-events-none" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </p>
      <div className={`mt-3 text-4xl font-bold ${accent}`}>
        <AnimatedCount value={value} decimals={decimals} suffix={suffix} />
      </div>
    </div>
  );
}

function TypeBadge({ type }) {
  const normalized = normalizeType(type);

  const isExpress = normalized === "express" || normalized === "expressway";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em]",
        isExpress
          ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
          : "border-blue-400/20 bg-blue-400/10 text-blue-300",
      ].join(" ")}
    >
      {isExpress ? "Express" : "Normal"}
    </span>
  );
}

export default function BusRoutesPage() {
  const nav = useNavigate();
  const location = useLocation();

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState(null);
  const [toast, setToast] = useState(null);
  const [routeNoFilter, setRouteNoFilter] = useState("");
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const res = await api.get("/api/bus/routes");
      setRoutes(res.data?.routes || []);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load routes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (location.state?.success) {
      setToast(location.state.success);
      nav(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, nav]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setPage(1);
  }, [routeNoFilter]);

  async function onDelete(id) {
    if (!window.confirm("Delete this route? This cannot be undone.")) return;

    setBusyId(id);
    try {
      await api.delete(`/api/bus/routes/${id}`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  const stats = useMemo(() => {
    const totalRoutes = routes.length;

    const normalRoutes = routes.filter((r) => {
      const t = normalizeType(r?.routeType);
      return t === "normal";
    }).length;

    const expressRoutes = routes.filter((r) => {
      const t = normalizeType(r?.routeType);
      return t === "express" || t === "expressway";
    }).length;

    const distanceValues = routes
      .map((r) => Number(r?.distanceKm))
      .filter((n) => Number.isFinite(n) && n > 0);

    const avgDistance =
      distanceValues.length > 0
        ? distanceValues.reduce((sum, n) => sum + n, 0) / distanceValues.length
        : 0;

    return {
      totalRoutes,
      normalRoutes,
      expressRoutes,
      avgDistance,
    };
  }, [routes]);

  const filteredRoutes = useMemo(() => {
    const q = routeNoFilter.trim().toLowerCase();

    if (!q) return routes;

    return routes.filter((r) =>
      String(r?.routeNumber || "").toLowerCase().includes(q)
    );
  }, [routes, routeNoFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRoutes.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedRoutes = filteredRoutes.slice(startIndex, startIndex + PAGE_SIZE);

  const shownFrom = filteredRoutes.length === 0 ? 0 : startIndex + 1;
  const shownTo = Math.min(startIndex + PAGE_SIZE, filteredRoutes.length);

  return (
    <div className="min-h-screen bg-[#06080d] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-[1400px]">
        {toast ? (
          <div className="fixed right-5 top-5 z-50 min-w-[260px] max-w-[360px] rounded-2xl border border-emerald-300/20 bg-emerald-50 px-4 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
            {toast}
          </div>
        ) : null}

        <div className="rounded-[30px] border border-white/8 bg-[#090b10] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.35)] md:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => nav("/bus")}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08]"
                  title="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                    Bus Routes
                  </h1>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                    Route Optimization & Logistics
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative min-w-[260px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={routeNoFilter}
                  onChange={(e) => setRouteNoFilter(e.target.value)}
                  placeholder="Filter by Route No..."
                  className="h-12 w-full rounded-full border border-white/8 bg-black/50 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-blue-400/40"
                />
              </div>

              <button
                type="button"
                onClick={() => nav("/bus/routes/new")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#bcd1ff] px-6 text-sm font-semibold text-[#111827] transition hover:brightness-105"
              >
                <Plus className="h-4 w-4" />
                Create Bus Route
              </button>

              <button
                type="button"
                onClick={load}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Routes" value={stats.totalRoutes} accent="text-white" />
            <StatCard title="Normal Path" value={stats.normalRoutes} accent="text-blue-300" />
            <StatCard title="Express Path" value={stats.expressRoutes} accent="text-amber-300" />
            <StatCard
              title="Avg Distance"
              value={stats.avgDistance}
              accent="text-white"
              decimals={1}
              suffix=" km"
            />
          </div>

          {loading ? (
            <div className="mt-8 rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-10 text-center text-zinc-400">
              Loading routes...
            </div>
          ) : null}

          {err ? (
            <div className="mt-8 rounded-[20px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          {!loading && !err && filteredRoutes.length === 0 ? (
            <div className="mt-8 rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-10 text-center text-zinc-500">
              No routes found.
            </div>
          ) : null}

          {!loading && !err && filteredRoutes.length > 0 ? (
            <div className="mt-8 overflow-hidden rounded-[24px] border border-white/8 bg-[#07090d]">
              <div className="hidden grid-cols-[120px_110px_1.6fr_110px_130px_120px] border-b border-white/6 bg-white/[0.02] px-5 py-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 md:grid">
                <div>Route No</div>
                <div>Type</div>
                <div>Start / End</div>
                <div>Stops</div>
                <div>Distance</div>
                <div>Actions</div>
              </div>

              <div className="divide-y divide-white/6">
                {paginatedRoutes.map((r) => {
                  const start = shortPlace(r?.start?.label);
                  const end = shortPlace(r?.end?.label);
                  const stopsCount = Array.isArray(r?.stops) ? r.stops.length : 0;
                  const distanceText = Number.isFinite(Number(r?.distanceKm))
                    ? `${Number(r.distanceKm).toFixed(1)} km`
                    : "-";

                  return (
                    <div
                      key={r._id}
                      className="grid gap-4 px-5 py-5 md:grid-cols-[120px_110px_1.6fr_110px_130px_120px] md:items-center"
                    >
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 md:hidden">
                          Route No
                        </div>
                        <div className="text-2xl font-bold text-white">{r?.routeNumber || "-"}</div>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 md:hidden">
                          Type
                        </div>
                        <TypeBadge type={r?.routeType} />
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 md:hidden">
                          Start / End
                        </div>
                        <div className="flex items-center gap-3 text-base font-semibold text-zinc-100">
                          <span>{start}</span>
                          <RouteIcon className="h-4 w-4 text-zinc-500" />
                          <span>{end}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 md:hidden">
                          Stops
                        </div>
                        <div className="text-lg font-semibold text-white">{stopsCount}</div>
                        <div className="text-sm text-zinc-500">Stops</div>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 md:hidden">
                          Distance
                        </div>
                        <div className="text-base font-semibold text-white">{distanceText}</div>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 md:hidden">
                          Actions
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => nav(`/bus/routes/${r._id}`)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-400/10 text-blue-300 transition hover:bg-blue-400/15"
                            title="Edit route"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDelete(r._id)}
                            disabled={busyId === r._id}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/15 bg-red-400/10 text-red-300 transition hover:bg-red-400/15 disabled:opacity-60"
                            title="Delete route"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-4 border-t border-white/6 bg-white/[0.02] px-5 py-4 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
                <div>
                  Showing {shownFrom}-{shownTo} of {filteredRoutes.length} routes
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-zinc-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNo) => (
                    <button
                      key={pageNo}
                      type="button"
                      onClick={() => setPage(pageNo)}
                      className={[
                        "inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-sm font-semibold transition",
                        pageNo === safePage
                          ? "bg-[#bcd1ff] text-[#111827]"
                          : "border border-white/8 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]",
                      ].join(" ")}
                    >
                      {pageNo}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-zinc-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}