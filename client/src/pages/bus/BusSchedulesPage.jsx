// client/src/pages/bus/BusSchedulesPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../lib/api";
import {
  CalendarClock,
  ArrowLeft,
  ArrowRightLeft,
  Save,
  RefreshCw,
  Trash2,
  Bus,
  MapPin,
  Clock3,
  ChevronRight,
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

function shortPlace(label = "") {
  if (!label) return "-";
  return String(label).split(",")[0].trim();
}

function directionLabel(route, dir) {
  if (!route) return dir;
  const a = route?.start?.label || "Start";
  const b = route?.end?.label || "End";
  return dir === "A_TO_B" ? `${a} → ${b}` : `${b} → ${a}`;
}

function directionShortLabel(route, dir) {
  if (!route) return dir === "A_TO_B" ? "Start → End" : "End → Start";
  const a = shortPlace(route?.start?.label || "Start");
  const b = shortPlace(route?.end?.label || "End");
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
  if (typeof t !== "string") return 9999;
  const m = t.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return 9999;
  return Number(m[1]) * 100 + Number(m[2]);
}

function isMeaningfulRange(start, end) {
  return !(start === "00:00" && end === "00:00");
}

function SmallMetric({ icon, label, value, tone = "text-white" }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
        <span className="text-zinc-400">{icon}</span>
        {label}
      </div>
      <div className={`mt-3 text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function WeeklyTimetable({ title, direction, schedules, buses }) {
  const busLabelById = useMemo(() => {
    const m = new Map();
    (buses || []).forEach((b) => {
      m.set(b._id, b.busNumber || b.plateNumber || b._id);
    });
    return m;
  }, [buses]);

  const byDay = useMemo(() => {
    const map = new Map();

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

      const day = s.dayOfWeek;
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
    <div className="rounded-[24px] border border-white/10 bg-[#0d1219] p-5 shadow-[0_14px_35px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-400/15 bg-blue-400/10 text-blue-300">
          <Clock3 className="h-5 w-5" />
        </div>

        <div>
          <div className="text-lg font-semibold text-white">{title}</div>
          <div className="text-sm text-zinc-500">
            Ordered by start-point departure time
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-white/[0.04]">
            <tr className="text-left">
              {DAYS.map((d) => (
                <th key={d.k} className="p-3 text-zinc-400">
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
                      <div className="rounded-xl border border-dashed border-white/8 bg-white/[0.02] px-3 py-3 text-zinc-500">
                        Not set
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {entries.map((e, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
                          >
                            <div className="font-semibold text-zinc-100">
                              {e.first} – {e.last}
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                              {e.label}
                            </div>
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
  const [draftTimes, setDraftTimes] = useState([]);

  const editorRef = useRef(null);

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
  }, []);

  useEffect(() => {
    if (!routeId) return;
    loadRouteBundle(routeId);
  }, [routeId]);

  useEffect(() => {
    if (!openEditor) return;
    const timer = setTimeout(() => {
      editorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);

    return () => clearTimeout(timer);
  }, [openEditor]);

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

    const selectedBus = busIdOverride || (direction === "A_TO_B" ? busA : busB);

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

    if (!busId) {
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
        busId,
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
    const busId = busIdOverride || (direction === "A_TO_B" ? busA : busB);
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
      return setMsg({
        type: "error",
        text: "No schedule to delete for this bus/day.",
      });
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
    const busId = busIdOverride || (direction === "A_TO_B" ? busA : busB);
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

  const currentDirectionTitle = useMemo(() => {
    if (!route || !openEditor) return "";
    return directionShortLabel(route, openEditor.direction);
  }, [route, openEditor]);

  return (
    <div className="min-h-screen bg-[#06080d] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="rounded-[30px] border border-white/8 bg-[#090b10] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.35)] md:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08]"
                title="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-400/15 bg-blue-400/10 text-blue-300">
                <CalendarClock className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                  Bus Schedules
                </h1>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                  Weekly Timetable & Direction Management
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
                  Publish weekly timetables per route, direction, day, and assigned bus.
                  Timetable cards remain read-only, while edits are managed from the
                  direction panels below.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[460px]">
              <SmallMetric
                icon={<MapPin className="h-4 w-4" />}
                label="Selected Route"
                value={route ? route.routeNumber : "--"}
                tone="text-blue-300"
              />
              <SmallMetric
                icon={<Bus className="h-4 w-4" />}
                label="Assigned Buses"
                value={buses.length}
                tone="text-white"
              />
              <SmallMetric
                icon={<Clock3 className="h-4 w-4" />}
                label="Saved Schedules"
                value={schedules.length}
                tone="text-emerald-300"
              />
            </div>
          </div>

          {msg && (
            <div
              className={
                "mt-6 rounded-[20px] border px-4 py-3 text-sm " +
                (msg.type === "success"
                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                  : "border-red-400/20 bg-red-500/10 text-red-200")
              }
            >
              {msg.text}
            </div>
          )}

          <div className="mt-7 rounded-[24px] border border-white/8 bg-[#0d1219] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
              <div className="grid gap-2 max-w-3xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Route Selector
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    className="min-w-[280px] rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-blue-400/40"
                    value={routeId}
                    onChange={(e) => setRouteId(e.target.value)}
                    disabled={loading}
                  >
                    {routes.map((r) => (
                      <option key={r._id} value={r._id} className="bg-[#10131a]">
                        {r.routeNumber} ({r.routeType})
                      </option>
                    ))}
                  </select>

                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-60"
                    onClick={() => loadRouteBundle(routeId)}
                    disabled={!routeId || loadingRoute}
                    type="button"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingRoute ? "animate-spin" : ""}`} />
                    {loadingRoute ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                <div className="text-sm text-zinc-400">
                  {routeHeader}
                </div>
              </div>
            </div>
          </div>

          {route ? (
            <div className="mt-7 grid gap-4">
              <WeeklyTimetable
                title={`Timetable • ${directionShortLabel(route, "A_TO_B")} • All buses`}
                direction="A_TO_B"
                schedules={schedules}
                buses={buses}
              />
              <WeeklyTimetable
                title={`Timetable • ${directionShortLabel(route, "B_TO_A")} • All buses`}
                direction="B_TO_A"
                schedules={schedules}
                buses={buses}
              />
            </div>
          ) : null}

          <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DirectionPanel
              title={directionShortLabel(route, "A_TO_B")}
              subtitle={directionLabel(route, "A_TO_B")}
              direction="A_TO_B"
              buses={buses}
              busId={busA}
              setBusId={setBusA}
              summaryFor={summaryFor}
              openDayEditor={openDayEditor}
              canDelete={canDelete}
              deleteScheduleEntry={deleteScheduleEntry}
              openEditor={openEditor}
            />

            <DirectionPanel
              title={directionShortLabel(route, "B_TO_A")}
              subtitle={directionLabel(route, "B_TO_A")}
              direction="B_TO_A"
              buses={buses}
              busId={busB}
              setBusId={setBusB}
              summaryFor={summaryFor}
              openDayEditor={openDayEditor}
              canDelete={canDelete}
              deleteScheduleEntry={deleteScheduleEntry}
              openEditor={openEditor}
            />
          </div>

          {openEditor && route ? (
            <div
              ref={editorRef}
              className="mt-7 rounded-[24px] border border-blue-400/15 bg-[#0d1219] p-5 shadow-[0_14px_35px_rgba(0,0,0,0.24)]"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-lg font-semibold text-white">
                    <ArrowRightLeft className="h-5 w-5 text-blue-300" />
                    Edit Schedule • {currentDirectionTitle}
                  </div>

                  <div className="mt-2 text-sm text-zinc-400">
                    {DAYS.find((d) => d.k === openEditor.dayOfWeek)?.label} • {openBusLabel}
                  </div>

                  <div className="mt-3 text-sm text-zinc-500">
                    Fill the time for each stop in order using 24-hour format HH:mm.
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                    onClick={closeEditor}
                    type="button"
                  >
                    Cancel
                  </button>

                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 text-sm font-medium text-red-200 transition hover:bg-red-400/15 disabled:opacity-50"
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
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>

                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#bcd1ff] px-5 text-sm font-semibold text-[#111827] transition hover:brightness-105"
                    onClick={saveEditor}
                    type="button"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                </div>
              </div>

              <StopTimeGrid
                stops={orderedStops(route, openEditor.direction)}
                draftTimes={draftTimes}
                onTimeChange={setTimeAt}
              />
            </div>
          ) : null}
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
  openEditor,
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#0d1219] p-5 shadow-[0_14px_35px_rgba(0,0,0,0.24)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="text-2xl font-bold text-white">{title}</div>
          <div className="mt-2 text-sm leading-6 text-zinc-400 break-words">
            {subtitle}
          </div>
        </div>

        <div className="min-w-[260px]">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Bus
          </div>
          <select
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-blue-400/40"
            value={busId || ""}
            onChange={(e) => setBusId(e.target.value)}
          >
            <option value="" disabled className="bg-[#10131a]">
              Select bus...
            </option>
            {(buses || []).map((b) => (
              <option key={b._id} value={b._id} className="bg-[#10131a]">
                {b.busNumber || b.plateNumber || b._id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-[120px_minmax(0,1fr)_180px] bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          <div>Day</div>
          <div>Summary</div>
          <div className="text-right">Action</div>
        </div>

        {DAYS.map((d) => {
          const active =
            openEditor?.direction === direction &&
            openEditor?.dayOfWeek === d.k &&
            openEditor?.busId === busId;

          return (
            <div
              key={d.k}
              className={[
                "grid grid-cols-[120px_minmax(0,1fr)_180px] items-center px-4 py-3 text-sm border-t border-white/10",
                active ? "bg-blue-400/[0.06]" : "",
              ].join(" ")}
            >
              <div className="font-semibold text-white">{d.label}</div>

              <div className="truncate text-zinc-300">
                {summaryFor(direction, d.k, busId)}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  className={[
                    "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium transition",
                    active
                      ? "bg-[#bcd1ff] text-[#111827]"
                      : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]",
                  ].join(" ")}
                  onClick={() => openDayEditor(direction, d.k, busId)}
                  type="button"
                >
                  Edit
                </button>

                <button
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-50"
                  disabled={!canDelete(direction, d.k, busId)}
                  onClick={() => deleteScheduleEntry(direction, d.k, busId)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
        <ChevronRight className="h-3.5 w-3.5" />
        Clicking Edit opens the day editor below and jumps directly to it.
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
    <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
      <div className="grid grid-cols-12 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
        <div className="col-span-1">#</div>
        <div className="col-span-8">Stop</div>
        <div className="col-span-3">Time</div>
      </div>

      {(stops || []).map((s, idx) => (
        <div
          key={`${s.lat},${s.lng},${idx}`}
          className="grid grid-cols-12 items-center border-t border-white/10 px-4 py-3"
        >
          <div className="col-span-1 font-semibold text-zinc-200">{idx}</div>

          <div className="col-span-8 pr-4">
            <div className="break-words text-sm text-zinc-100">{s.label}</div>
            <div className="mt-1 text-xs text-zinc-500">
              {Number(s.lat).toFixed(5)}, {Number(s.lng ?? s.lon).toFixed(5)}
            </div>
          </div>

          <div className="col-span-3">
            <input
              value={timeByIndex.get(idx) || "00:00"}
              onChange={(e) => onTimeChange(idx, e.target.value)}
              placeholder="06:30"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none transition focus:border-blue-400/40"
            />
          </div>
        </div>
      ))}
    </div>
  );
}