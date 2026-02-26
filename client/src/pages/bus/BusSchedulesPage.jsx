// client/src/pages/bus/BusSchedulesPage.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import { CalendarClock, ArrowRightLeft, Save, RefreshCw } from "lucide-react";

const DAYS = [
  { k: 1, label: "Mon" },
  { k: 2, label: "Tue" },
  { k: 3, label: "Wed" },
  { k: 4, label: "Thu" },
  { k: 5, label: "Fri" },
  { k: 6, label: "Sat" },
  { k: 0, label: "Sun" },
];

function directionLabel(route, dir) {
  if (!route) return dir;
  const a = route?.start?.label || "Start";
  const b = route?.end?.label || "End";
  return dir === "A_TO_B" ? `${a} → ${b}` : `${b} → ${a}`;
}

function orderedStops(route, dir) {
  if (!route) return [];
  const base = [route.start, ...(route.stops || []), route.end].filter(Boolean);
  return dir === "B_TO_A" ? [...base].reverse() : base;
}

function hhmmOr00(v) {
  if (typeof v !== "string") return "00:00";
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : "00:00";
}

function scheduleKey({ busId, direction, dayOfWeek }) {
  return `${busId}::${direction}::${dayOfWeek}`;
}

export default function BusSchedulesPage() {
  const [routes, setRoutes] = useState([]);
  const [routeId, setRouteId] = useState("");
  const [route, setRoute] = useState(null);

  const [buses, setBuses] = useState([]);
  const [busA, setBusA] = useState("");
  const [busB, setBusB] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [msg, setMsg] = useState(null);

  const [schedules, setSchedules] = useState([]);
  const [openEditor, setOpenEditor] = useState(null); // {direction, dayOfWeek}
  const [draftTimes, setDraftTimes] = useState([]); // {stopIndex,time}

  const schedulesMap = useMemo(() => {
    const m = new Map();
    for (const s of schedules || []) {
      const busId = s?.busId?._id || s?.busId;
      if (!busId) continue;
      m.set(
        scheduleKey({ busId, direction: s.direction, dayOfWeek: s.dayOfWeek }),
        s
      );
    }
    return m;
  }, [schedules]);

  async function loadRoutes() {
    setLoading(true);
    setMsg(null);
    try {
      // ✅ IMPORTANT: backend is mounted at /api/bus
      const res = await api.get("/api/bus/routes");
      const list = res.data?.routes || [];
      setRoutes(list);

      const first = list?.[0]?._id || "";
      setRouteId((prev) => prev || first);
    } catch (e) {
      setMsg({
        type: "error",
        text: e?.response?.data?.message || e.message || "Failed to load routes",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadRouteBundle(rid) {
    if (!rid) return;
    setLoadingRoute(true);
    setMsg(null);
    setOpenEditor(null);
    setDraftTimes([]);

    try {
      // ✅ IMPORTANT: all /api/bus
      const [routeRes, busesRes, schedulesRes] = await Promise.all([
        api.get(`/api/bus/routes/${rid}`),
        api.get(`/api/bus/routes/${rid}/buses`),
        api.get(`/api/bus/routes/${rid}/schedules`),
      ]);

      const fullRoute = routeRes.data?.route || routeRes.data;
      setRoute(fullRoute);

      const bs = busesRes.data?.buses || [];
      setBuses(bs);

      const firstBus = bs?.[0]?._id || "";
      setBusA((prev) => prev || firstBus);
      setBusB((prev) => prev || firstBus);

      setSchedules(schedulesRes.data?.schedules || []);
    } catch (e) {
      setMsg({
        type: "error",
        text:
          e?.response?.data?.message ||
          e.message ||
          "Failed to load schedules bundle",
      });
    } finally {
      setLoadingRoute(false);
    }
  }

  useEffect(() => {
    loadRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!routeId) return;
    loadRouteBundle(routeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  function openDayEditor(direction, dayOfWeek) {
    const selectedBus = direction === "A_TO_B" ? busA : busB;
    if (!selectedBus) {
      setMsg({ type: "error", text: "Select a bus first" });
      return;
    }

    const key = scheduleKey({ busId: selectedBus, direction, dayOfWeek });
    const existing = schedulesMap.get(key);

    const stops = orderedStops(route, direction);
    const existingTimes = new Map();
    for (const st of existing?.stopTimes || []) {
      existingTimes.set(st.stopIndex, hhmmOr00(st.time));
    }

    const draft = stops.map((_, idx) => ({
      stopIndex: idx,
      time: existingTimes.get(idx) || "00:00",
    }));

    setDraftTimes(draft);
    setOpenEditor({ direction, dayOfWeek });
    setMsg(null);
  }

  function closeEditor() {
    setOpenEditor(null);
    setDraftTimes([]);
  }

  function setTimeAt(index, time) {
    setDraftTimes((prev) =>
      prev.map((t) => (t.stopIndex === index ? { ...t, time } : t))
    );
  }

  async function saveEditor() {
    if (!openEditor) return;

    const { direction, dayOfWeek } = openEditor;
    const selectedBus = direction === "A_TO_B" ? busA : busB;
    if (!selectedBus) return setMsg({ type: "error", text: "Select a bus first" });

    for (const row of draftTimes) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(row.time)) {
        return setMsg({
          type: "error",
          text: "Time format must be HH:mm (e.g., 06:30)",
        });
      }
    }

    try {
      setMsg(null);

      const payload = {
        busId: selectedBus,
        direction,
        dayOfWeek,
        times: draftTimes,
      };

      // ✅ IMPORTANT
      await api.post(`/api/bus/routes/${routeId}/schedules`, payload);

      const sres = await api.get(`/api/bus/routes/${routeId}/schedules`);
      setSchedules(sres.data?.schedules || []);

      setMsg({ type: "success", text: "Schedule saved successfully" });
      closeEditor();
    } catch (e) {
      setMsg({
        type: "error",
        text: e?.response?.data?.message || e.message || "Save failed",
      });
    }
  }

  function summaryFor(direction, dayOfWeek) {
    const busId = direction === "A_TO_B" ? busA : busB;
    if (!busId) return "—";
    const key = scheduleKey({ busId, direction, dayOfWeek });
    const s = schedulesMap.get(key);
    if (!s?.stopTimes?.length) return "Not set";

    const first = s.stopTimes[0]?.time;
    const last = s.stopTimes[s.stopTimes.length - 1]?.time;
    if (!first || !last) return "Not set";
    return `${hhmmOr00(first)} → ${hhmmOr00(last)}`;
  }

  const routeHeader = route
    ? `${route.routeNumber} • ${route.routeType}`
    : "Select a route";

  return (
    <div className="p-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Bus Schedules</h1>
          </div>
          <div className="text-sm text-zinc-400">
            Publish weekly timetables per route • direction • bus
          </div>
        </div>

        <p className="mt-2 text-sm text-zinc-400">
          Governance rule: schedules are defined per <b>Route + Direction + Day + Bus</b>.
          Stop times are captured for every stop in sequence.
        </p>

        {msg && (
          <div
            className={
              "mt-4 rounded-xl border p-3 " +
              (msg.type === "success"
                ? "border-emerald-400/30 bg-emerald-500/10"
                : "border-red-400/30 bg-red-500/10")
            }
          >
            {msg.text}
          </div>
        )}

        <div className="mt-5 grid gap-4">
          <div className="grid gap-2 max-w-2xl">
            <div className="text-sm text-white/70">Route</div>
            <div className="flex gap-2 items-center flex-wrap">
              <select
                className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none min-w-[280px]"
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                disabled={loading}
              >
                {routes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.routeNumber} ({r.routeType})
                  </option>
                ))}
              </select>

              <button
                className="btn"
                onClick={() => loadRouteBundle(routeId)}
                disabled={!routeId || loadingRoute}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="ml-2">{loadingRoute ? "Refreshing..." : "Refresh"}</span>
              </button>

              <div className="text-sm text-zinc-400">{routeHeader}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DirectionPanel
              title="Direction A → B"
              subtitle={directionLabel(route, "A_TO_B")}
              direction="A_TO_B"
              buses={buses}
              busId={busA}
              setBusId={setBusA}
              summaryFor={summaryFor}
              openDayEditor={openDayEditor}
            />

            <DirectionPanel
              title="Direction B → A"
              subtitle={directionLabel(route, "B_TO_A")}
              direction="B_TO_A"
              buses={buses}
              busId={busB}
              setBusId={setBusB}
              summaryFor={summaryFor}
              openDayEditor={openDayEditor}
            />
          </div>

          {openEditor && route && (
            <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  <div className="font-semibold">
                    Edit: {openEditor.direction === "A_TO_B" ? "A → B" : "B → A"} •{" "}
                    {DAYS.find((d) => d.k === openEditor.dayOfWeek)?.label}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="btn" onClick={closeEditor}>
                    Cancel
                  </button>
                  <button className="btn-primary btn" onClick={saveEditor}>
                    <Save className="h-4 w-4" />
                    <span className="ml-2">Save</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 text-sm text-zinc-400">
                Fill time for each stop in order. Use 24-hour format HH:mm.
              </div>

              <StopTimeGrid
                stops={orderedStops(route, openEditor.direction)}
                draftTimes={draftTimes}
                onTimeChange={setTimeAt}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DirectionPanel({
  title,
  subtitle,
  direction,
  buses,
  busId,
  setBusId,
  summaryFor,
  openDayEditor,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-zinc-400 mt-1">{subtitle}</div>
        </div>

        <div className="min-w-[260px]">
          <div className="text-xs text-white/60 mb-1">Bus</div>
          <select
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white outline-none"
            value={busId || ""}
            onChange={(e) => setBusId(e.target.value)}
          >
            <option value="" disabled>
              Select bus...
            </option>
            {(buses || []).map((b) => (
              <option key={b._id} value={b._id}>
                {b.busNumber || b.plateNumber || b._id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
        <div className="grid grid-cols-3 px-4 py-3 text-xs font-semibold bg-white/5">
          <div>Day</div>
          <div>Summary</div>
          <div className="text-right">Action</div>
        </div>

        {DAYS.map((d) => (
          <div
            key={d.k}
            className="grid grid-cols-3 px-4 py-3 border-t border-white/10 text-sm items-center"
          >
            <div className="font-semibold">{d.label}</div>
            <div className="text-zinc-300">{summaryFor(direction, d.k)}</div>
            <div className="text-right">
              <button className="btn" onClick={() => openDayEditor(direction, d.k)}>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-zinc-400">
        Tip: Keep stop times realistic.
      </div>
    </div>
  );
}

function StopTimeGrid({ stops, draftTimes, onTimeChange }) {
  const timeByIndex = useMemo(() => {
    const m = new Map();
    for (const t of draftTimes || []) m.set(t.stopIndex, t.time);
    return m;
  }, [draftTimes]);

  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
      <div className="grid grid-cols-12 px-4 py-3 text-xs font-semibold bg-white/5">
        <div className="col-span-1">#</div>
        <div className="col-span-8">Stop</div>
        <div className="col-span-3">Time (HH:mm)</div>
      </div>

      {(stops || []).map((s, idx) => (
        <div
          key={`${s.lat},${s.lng},${idx}`}
          className="grid grid-cols-12 px-4 py-3 border-t border-white/10 items-center"
        >
          <div className="col-span-1 font-semibold text-zinc-200">{idx}</div>
          <div className="col-span-8">
            <div className="text-sm text-zinc-100">{s.label}</div>
            <div className="text-xs text-zinc-500">
              {Number(s.lat).toFixed(5)}, {Number(s.lng ?? s.lon).toFixed(5)}
            </div>
          </div>
          <div className="col-span-3">
            <input
              value={timeByIndex.get(idx) || "00:00"}
              onChange={(e) => onTimeChange(idx, e.target.value)}
              placeholder="06:30"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white outline-none"
            />
          </div>
        </div>
      ))}
    </div>
  );
}