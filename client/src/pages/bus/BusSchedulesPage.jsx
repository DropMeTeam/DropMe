// client/src/pages/bus/BusSchedulesPage.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import {
  CalendarClock,
  ArrowRightLeft,
  Save,
  RefreshCw,
  Trash2,
} from "lucide-react";

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

function timeToNumber(t) {
  // "08:30" -> 830 for sorting
  if (typeof t !== "string") return 9999;
  const m = t.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return 9999;
  return Number(m[1]) * 100 + Number(m[2]);
}

function isMeaningfulRange(start, end) {
  // ignore default "00:00 → 00:00"
  return !(start === "00:00" && end === "00:00");
}

// ✅ READ-ONLY timetable: days as columns, entries sorted by start-point time
function WeeklyTimetable({ title, direction, schedules, buses }) {
  const busLabelById = useMemo(() => {
    const m = new Map();
    (buses || []).forEach((b) => {
      m.set(b._id, b.busNumber || b.plateNumber || b._id);
    });
    return m;
  }, [buses]);

  const byDay = useMemo(() => {
    const map = new Map(); // day -> entries[]
    for (const s of schedules || []) {
      if (s.direction !== direction) continue;

      const busId = s?.busId?._id || s?.busId;
      const label =
        s?.busId?.busNumber ||
        s?.busId?.plateNumber ||
        busLabelById.get(busId) ||
        busId ||
        "—";

      const first = s?.stopTimes?.[0]?.time || "00:00";
      const last = s?.stopTimes?.[s.stopTimes.length - 1]?.time || "00:00";
      if (!isMeaningfulRange(first, last)) continue;

      const day = s.dayOfWeek; // 0..6
      if (!map.has(day)) map.set(day, []);
      map.get(day).push({ first, last, label });
    }

    for (const [day, arr] of map.entries()) {
      arr.sort((a, b) => timeToNumber(a.first) - timeToNumber(b.first));
      map.set(day, arr);
    }

    return map;
  }, [schedules, direction, busLabelById]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="font-semibold mb-3">{title}</div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-white/5">
            <tr className="text-left">
              {DAYS.map((d) => (
                <th key={d.k} className="p-3">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr className="border-t border-white/10 align-top">
              {DAYS.map((d) => {
                const entries = byDay.get(d.k) || [];
                return (
                  <td key={d.k} className="p-3">
                    {entries.length === 0 ? (
                      <div className="text-zinc-500">Not set</div>
                    ) : (
                      <div className="grid gap-2">
                        {entries.map((e, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                          >
                            <div className="text-zinc-200 font-semibold">
                              {e.first} – {e.last}
                            </div>
                            <div className="text-zinc-400 text-xs">{e.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-xs text-zinc-400">
        Ordered by start-point departure time.
      </div>
    </div>
  );
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
  const [openEditor, setOpenEditor] = useState(null); // {direction, dayOfWeek, busId}
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

  async function refreshSchedules() {
    if (!routeId) return;
    const sres = await api.get(`/api/bus/routes/${routeId}/schedules`);
    setSchedules(sres.data?.schedules || []);
  }

  async function loadRoutes() {
    setLoading(true);
    setMsg(null);
    try {
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

  function closeEditor() {
    setOpenEditor(null);
    setDraftTimes([]);
  }

  function setTimeAt(index, time) {
    setDraftTimes((prev) =>
      prev.map((t) => (t.stopIndex === index ? { ...t, time } : t))
    );
  }

  function openDayEditor(direction, dayOfWeek, busIdOverride) {
    if (!route) {
      setMsg({ type: "error", text: "Select a route first" });
      return;
    }

    const selectedBus =
      busIdOverride || (direction === "A_TO_B" ? busA : busB);

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
    setOpenEditor({ direction, dayOfWeek, busId: selectedBus });
    setMsg(null);
  }

  async function saveEditor() {
    if (!openEditor) return;

    const { direction, dayOfWeek, busId } = openEditor;
    const selectedBus = busId;

    if (!selectedBus) {
      return setMsg({ type: "error", text: "Select a bus first" });
    }

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

      await api.post(`/api/bus/routes/${routeId}/schedules`, payload);
      await refreshSchedules();

      setMsg({ type: "success", text: "Schedule saved successfully" });
      closeEditor();
    } catch (e) {
      setMsg({
        type: "error",
        text: e?.response?.data?.message || e.message || "Save failed",
      });
    }
  }

  function getSchedule(direction, dayOfWeek, busIdOverride) {
    const busId =
      busIdOverride || (direction === "A_TO_B" ? busA : busB);
    if (!busId) return null;

    const key = scheduleKey({ busId, direction, dayOfWeek });
    return schedulesMap.get(key) || null;
  }

  function canDelete(direction, dayOfWeek, busIdOverride) {
    return !!getSchedule(direction, dayOfWeek, busIdOverride)?._id;
  }

  async function deleteScheduleEntry(direction, dayOfWeek, busIdOverride) {
    const s = getSchedule(direction, dayOfWeek, busIdOverride);
    if (!s?._id) {
      return setMsg({ type: "error", text: "No schedule to delete for this bus/day." });
    }

    const ok = window.confirm("Delete this schedule? This cannot be undone.");
    if (!ok) return;

    try {
      setMsg(null);
      await api.delete(`/api/bus/schedules/${s._id}`);
      await refreshSchedules();

      if (
        openEditor &&
        openEditor.direction === direction &&
        openEditor.dayOfWeek === dayOfWeek &&
        openEditor.busId === (busIdOverride || openEditor.busId)
      ) {
        closeEditor();
      }

      setMsg({ type: "success", text: "Schedule deleted." });
    } catch (e) {
      setMsg({
        type: "error",
        text: e?.response?.data?.message || e.message || "Delete failed",
      });
    }
  }

  function summaryFor(direction, dayOfWeek, busIdOverride) {
    const busId =
      busIdOverride || (direction === "A_TO_B" ? busA : busB);
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

  const openBusLabel = useMemo(() => {
    if (!openEditor?.busId) return "";
    const b = (buses || []).find((x) => x._id === openEditor.busId);
    return b ? b.busNumber || b.plateNumber || b._id : openEditor.busId;
  }, [openEditor?.busId, buses]);

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
          Schedules are defined per <b>Route + Direction + Day + Bus</b>.
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
          {/* Route selector */}
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
                <span className="ml-2">
                  {loadingRoute ? "Refreshing..." : "Refresh"}
                </span>
              </button>

              <div className="text-sm text-zinc-400">{routeHeader}</div>
            </div>
          </div>

          {/* ✅ READ-ONLY TIMETABLE (NO EDIT/DELETE HERE) */}
          {route && (
            <div className="grid gap-4">
              <WeeklyTimetable
                title="Timetable (A → B) • All buses"
                direction="A_TO_B"
                schedules={schedules}
                buses={buses}
              />
              <WeeklyTimetable
                title="Timetable (B → A) • All buses"
                direction="B_TO_A"
                schedules={schedules}
                buses={buses}
              />
            </div>
          )}

          {/* Editors (create/update/delete schedules) */}
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
              canDelete={canDelete}
              deleteScheduleEntry={deleteScheduleEntry}
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
              canDelete={canDelete}
              deleteScheduleEntry={deleteScheduleEntry}
            />
          </div>

          {/* Editor panel */}
          {openEditor && route && (
            <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  <div className="font-semibold">
                    Edit:{" "}
                    {openEditor.direction === "A_TO_B" ? "A → B" : "B → A"} •{" "}
                    {DAYS.find((d) => d.k === openEditor.dayOfWeek)?.label} •{" "}
                    {openBusLabel}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="btn" onClick={closeEditor}>
                    Cancel
                  </button>

                  <button
                    className="btn"
                    onClick={() =>
                      deleteScheduleEntry(
                        openEditor.direction,
                        openEditor.dayOfWeek,
                        openEditor.busId
                      )
                    }
                    disabled={
                      !canDelete(
                        openEditor.direction,
                        openEditor.dayOfWeek,
                        openEditor.busId
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-2">Delete</span>
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
  canDelete,
  deleteScheduleEntry,
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
            <div className="text-zinc-300">{summaryFor(direction, d.k, busId)}</div>
            <div className="text-right">
              <div className="flex justify-end gap-2">
                <button className="btn" onClick={() => openDayEditor(direction, d.k, busId)}>
                  Edit
                </button>

                <button
                  className="btn"
                  disabled={!canDelete(direction, d.k, busId)}
                  onClick={() => deleteScheduleEntry(direction, d.k, busId)}
                >
                  Delete
                </button>
              </div>
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