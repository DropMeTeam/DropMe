import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";

import RouteBuilder from "./components/schedules/RouteBuilder";

import "./components/timetables/timetables-theme.css";
import TimetableManagementHeader from "./components/timetables/TimetableManagementHeader";
import TrainScheduleSearchPanel from "./components/timetables/TrainScheduleSearchPanel";
import TrainMetaEditorCard from "./components/timetables/TrainMetaEditorCard";
import WeeklyTimetableEditor from "./components/timetables/WeeklyTimetableEditor";
import ManageScheduleActionPanel from "./components/timetables/ManageScheduleActionPanel";

import { computeSegments } from "./lib/routing";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function uid() {
  return globalThis.crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function newStop(order) {
  return { key: uid(), stationId: "", order };
}

function normalizeStop(stop) {
  const stationId = stop?.stationId?._id
    ? String(stop.stationId._id)
    : String(stop?.stationId || "");

  return {
    stationId,
    stationName: stop?.stationId?.name || stop?.stationName || "Station",
    order: Number(stop?.order || 0),
    arrivalTime: stop?.arrivalTime || "",
    departureTime: stop?.departureTime || "",
  };
}

function buildWeek(schedule) {
  const baseStops = (schedule?.stops || [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(normalizeStop);

  const week = {};
  for (const day of DAYS) {
    const rows = schedule?.weeklyTimetable?.[day];
    if (Array.isArray(rows) && rows.length) {
      week[day] = rows.slice().sort((a, b) => a.order - b.order).map(normalizeStop);
    } else {
      week[day] = baseStops.map((row) => ({ ...row }));
    }
  }

  return week;
}

function buildEmptyWeek() {
  const week = {};
  for (const day of DAYS) week[day] = [];
  return week;
}

function getSegmentKey(seg) {
  const fromId = String(seg?.fromStationId?._id || seg?.fromStationId || seg?.fromId || "");
  const toId = String(seg?.toStationId?._id || seg?.toStationId || seg?.toId || "");
  return `${fromId}-${toId}`;
}

export default function TrainTimetablesPage() {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  const [stations, setStations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const [mode, setMode] = useState("route");
  const [activeDay, setActiveDay] = useState("Mon");

  const [trainName, setTrainName] = useState("");
  const [trainNo, setTrainNo] = useState("");
  const [seatCapacity, setSeatCapacity] = useState(200);
  const [active, setActive] = useState(true);

  const [startId, setStartId] = useState("");
  const [endId, setEndId] = useState("");
  const [stops, setStops] = useState([newStop(1), newStop(2)]);

  const [segments, setSegments] = useState([]);
  const [, setTotalKm] = useState(0);
  const [, setTotalMin] = useState(0);

  const [segmentFares, setSegmentFares] = useState({});
  const [week, setWeek] = useState(buildEmptyWeek);

  async function loadAll() {
    setLoading(true);
    setMsg("");

    try {
      const [stationsRes, schedulesRes] = await Promise.all([
        api.get("/api/admin/train/stations"),
        api.get("/api/admin/train/schedules"),
      ]);

      setStations(stationsRes.data.stations || []);
      setSchedules(schedulesRes.data.schedules || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const selected = useMemo(
    () => schedules.find((schedule) => String(schedule._id) === String(selectedId)),
    [schedules, selectedId]
  );

  const stationById = useMemo(() => {
    const map = new Map();
    stations.forEach((station) => map.set(String(station._id), station));
    return map;
  }, [stations]);

  const filteredSchedules = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schedules;

    return schedules.filter((schedule) => {
      const no = String(schedule?.trainNo || "").toLowerCase();
      const name = String(schedule?.trainName || "").toLowerCase();
      return no.includes(q) || name.includes(q);
    });
  }, [schedules, search]);

  const stopsOrdered = useMemo(() => {
    return [...stops]
      .sort((a, b) => a.order - b.order)
      .map((stop) => ({
        ...stop,
        station: stop.stationId ? stationById.get(String(stop.stationId)) : null,
      }));
  }, [stops, stationById]);

  function loadSelectedIntoForm(item) {
    if (!item) return;

    setTrainName(item.trainName || "");
    setTrainNo(item.trainNo || "");
    setSeatCapacity(item.seatCapacity || 200);
    setActive(item.active ?? true);

    const mappedStops = (item.stops || [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((stop) => ({
        key: uid(),
        stationId: String(stop.stationId?._id || stop.stationId || ""),
        order: Number(stop.order),
      }));

    const safeStops = mappedStops.length >= 2 ? mappedStops : [newStop(1), newStop(2)];

    setStops(safeStops.map((stop, index) => ({ ...stop, order: index + 1 })));
    setStartId(safeStops[0]?.stationId || "");
    setEndId(safeStops[safeStops.length - 1]?.stationId || "");
    setWeek(buildWeek(item));

    const initialFares = {};
    (item.segments || []).forEach((segment) => {
      initialFares[getSegmentKey(segment)] = segment.fareLkr || 0;
    });
    setSegmentFares(initialFares);

    setMode("route");
    setActiveDay("Mon");
  }

  useEffect(() => {
    if (!selected) return;
    loadSelectedIntoForm(selected);
  }, [selected]);

  useEffect(() => {
    if (!startId && !endId) return;

    setStops((prev) => {
      const ordered = [...prev].sort((a, b) => a.order - b.order);
      const base = ordered.length >= 2 ? ordered : [newStop(1), newStop(2)];
      const next = base.map((stop) => ({ ...stop }));

      if (startId) next[0].stationId = startId;
      if (endId) next[next.length - 1].stationId = endId;

      return next.map((stop, index) => ({ ...stop, order: index + 1 }));
    });
  }, [startId, endId]);

  const stopsKey = useMemo(
    () => stopsOrdered.map((stop) => String(stop.stationId || "")).join("|"),
    [stopsOrdered]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const orderedStations = stopsOrdered.map((stop) => stop.station).filter(Boolean);
        const result = await computeSegments(orderedStations);
        if (cancelled) return;

        setSegments(result.segments || []);
        setTotalKm(result.totalKm || 0);
        setTotalMin(result.totalMin || 0);
      } catch {
        if (!cancelled) {
          setSegments([]);
          setTotalKm(0);
          setTotalMin(0);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stopsKey]);

  const routeRows = useMemo(() => {
    return stopsOrdered
      .filter((stop) => stop.stationId)
      .map((stop, index) => ({
        stationId: String(stop.stationId),
        stationName: stop.station?.name || `Stop ${index + 1}`,
        order: index + 1,
        arrivalTime: "",
        departureTime: "",
      }));
  }, [stopsOrdered]);

  const routeSignature = useMemo(
    () => routeRows.map((row) => `${row.stationId}-${row.order}`).join("|"),
    [routeRows]
  );

  useEffect(() => {
    if (!routeRows.length) {
      setWeek(buildEmptyWeek());
      return;
    }

    setWeek((prev) => {
      const next = {};
      for (const day of DAYS) {
        const existingByStation = new Map((prev[day] || []).map((row) => [row.stationId, row]));
        next[day] = routeRows.map((row) => {
          const existing = existingByStation.get(row.stationId);
          return existing
            ? {
                ...row,
                arrivalTime: existing.arrivalTime || "",
                departureTime: existing.departureTime || "",
              }
            : { ...row };
        });
      }
      return next;
    });
  }, [routeSignature]);

  function addStop() {
    setStops((prev) => {
      const ordered = [...prev].sort((a, b) => a.order - b.order);
      const maxOrder = ordered.reduce((max, stop) => Math.max(max, stop.order), 0);
      return [...ordered, newStop(maxOrder + 1)];
    });
  }

  function removeStop(key) {
    setStops((prev) =>
      prev
        .filter((stop) => stop.key !== key)
        .sort((a, b) => a.order - b.order)
        .map((stop, index) => ({ ...stop, order: index + 1 }))
    );
  }

  function updateStopStation(key, stationId) {
    setStops((prev) => prev.map((stop) => (stop.key === key ? { ...stop, stationId } : stop)));
  }

  function addIntermediateStation(stationId) {
    if (!stationId) return;

    setStops((prev) => {
      const ordered = [...prev].sort((a, b) => a.order - b.order);
      if (ordered.some((stop) => String(stop.stationId) === String(stationId))) return prev;

      const first = ordered[0];
      const last = ordered[ordered.length - 1];
      const middle = ordered.slice(1, -1);

      return [first, ...middle, { ...newStop(0), stationId }, last].map((stop, index) => ({
        ...stop,
        order: index + 1,
      }));
    });
  }

  function setWeekCell(day, index, field, value) {
    setWeek((prev) => {
      const copy = { ...prev };
      const rows = (copy[day] || []).map((row) => ({ ...row }));
      if (!rows[index]) return prev;
      rows[index][field] = value;
      copy[day] = rows;
      return copy;
    });
  }

  function resetEditor() {
    if (selected) {
      loadSelectedIntoForm(selected);
      setMsg("Changes reverted to loaded train");
    } else {
      setTrainName("");
      setTrainNo("");
      setSeatCapacity(200);
      setActive(true);
      setStartId("");
      setEndId("");
      setStops([newStop(1), newStop(2)]);
      setSegments([]);
      setTotalKm(0);
      setTotalMin(0);
      setSegmentFares({});
      setWeek(buildEmptyWeek());
      setMode("route");
      setActiveDay("Mon");
      setMsg("");
    }
  }

  function getBaseStopsFromWeek() {
    const mondayRows = week.Mon || [];
    if (mondayRows.length) return mondayRows;

    for (const day of DAYS) {
      if (week[day]?.length) return week[day];
    }

    return [];
  }

  async function saveChanges() {
    if (!selectedId) {
      setMsg("Select a train first");
      return;
    }

    setMsg("");
    setBusy(true);

    try {
      if (!trainNo.trim()) throw new Error("Train No is required");
      if (stopsOrdered.length < 2) throw new Error("At least 2 stops required");
      if (stopsOrdered.some((stop) => !stop.stationId)) throw new Error("Select station for every stop");

      const baseRows = getBaseStopsFromWeek();

      if (!baseRows.length || baseRows.length !== routeRows.length) {
        throw new Error("Complete the weekly timetable rows for the current route before saving.");
      }

      const faresArr = segments.map((segment) => {
        const key = getSegmentKey(segment);
        const val = Number(segmentFares[key] || 0);
        if (Number.isNaN(val) || val < 0) {
          throw new Error(`Invalid fare for segment ${key}`);
        }
        return val;
      });

      const weeklyTimetable = {};
      for (const day of DAYS) {
        weeklyTimetable[day] = (week[day] || []).map((row, index) => ({
          stationId: row.stationId,
          order: index + 1,
          arrivalTime: row.arrivalTime || "",
          departureTime: row.departureTime || "",
        }));

        if (weeklyTimetable[day].length !== routeRows.length) {
          throw new Error(`${day}: timetable rows do not match the current route.`);
        }

        for (const row of weeklyTimetable[day]) {
          if (!row.departureTime) {
            throw new Error(`${day}: departureTime required for all stops`);
          }
        }
      }

      const payload = {
        trainName,
        trainNo: trainNo.trim(),
        seatCapacity: Number(seatCapacity),
        active,
        stops: baseRows.map((row, index) => ({
          stationId: row.stationId,
          order: index + 1,
          arrivalTime: row.arrivalTime || "",
          departureTime: row.departureTime || "",
        })),
        segmentFares: faresArr,
        weeklyTimetable,
      };

      await api.put(`/api/admin/train/schedules/${selectedId}`, payload);
      setMsg("Train schedule updated successfully");
      await loadAll();
    } catch (e) {
      setMsg(e?.response?.data?.message || e.message || "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelectedTrain() {
    if (!selectedId) {
      setMsg("Select a train first");
      return;
    }

    if (!window.confirm("Delete this train schedule?")) return;

    setMsg("");
    setBusy(true);

    try {
      await api.delete(`/api/admin/train/schedules/${selectedId}`);
      setSelectedId("");
      setSearch("");
      resetEditor();
      setMsg("Train schedule deleted");
      await loadAll();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="train-timetable-manager min-h-screen bg-[#040914] px-4 py-4 text-white lg:px-6">
      <div className="mx-auto max-w-[1760px] space-y-6">
        <TimetableManagementHeader
          totalSchedules={schedules.length}
          totalStations={stations.length}
          selectedTrainNo={selected?.trainNo || ""}
        />

        {msg ? (
          <div className="rounded-2xl border border-amber-300/15 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {msg}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <TrainScheduleSearchPanel
            loading={loading}
            schedules={filteredSchedules}
            search={search}
            setSearch={setSearch}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={async (id) => {
              if (!window.confirm("Delete this train schedule?")) return;
              setBusy(true);
              try {
                await api.delete(`/api/admin/train/schedules/${id}`);
                if (String(selectedId) === String(id)) setSelectedId("");
                setMsg("Train schedule deleted");
                await loadAll();
              } catch (e) {
                setMsg(e?.response?.data?.message || "Delete failed");
              } finally {
                setBusy(false);
              }
            }}
          />

          <section className="space-y-5">
            <TrainMetaEditorCard
              trainNo={trainNo}
              setTrainNo={setTrainNo}
              trainName={trainName}
              setTrainName={setTrainName}
              seatCapacity={seatCapacity}
              setSeatCapacity={setSeatCapacity}
              active={active}
              setActive={setActive}
              disabled={!selectedId}
            />

            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(21,30,43,0.96)_0%,rgba(11,17,27,0.96)_100%)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Manage Train Schedule</h2>
                  <p className="mt-1 text-sm text-white/45">
                    Edit route, weekday timetable, fares, and train details in one workspace.
                  </p>
                </div>

                <div className="inline-flex flex-wrap rounded-2xl border border-white/10 bg-black/20 p-1">
                  {[
                    ["route", "Route Builder"],
                    ["weekly", "Weekly Timetable"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMode(value)}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                        mode === value
                          ? "bg-blue-500/20 text-blue-100 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.35)]"
                          : "text-white/55 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-5">
                <section className="space-y-5 min-w-0">
                  {mode === "route" ? (
                    <RouteBuilder
                      stations={stations}
                      startId={startId}
                      setStartId={setStartId}
                      endId={endId}
                      setEndId={setEndId}
                      stopsOrdered={stopsOrdered}
                      onAddIntermediate={addIntermediateStation}
                      onAddStop={addStop}
                      onRemoveStop={removeStop}
                      onUpdateStopStation={updateStopStation}
                    />
                  ) : null}

                  {mode === "weekly" ? (
                    <WeeklyTimetableEditor
                      days={DAYS}
                      activeDay={activeDay}
                      setActiveDay={setActiveDay}
                      week={week}
                      setCell={setWeekCell}
                    />
                  ) : null}
                </section>

                <aside className="grid gap-4 border-t border-white/10 pt-5 xl:grid-cols-[minmax(0,1fr)_330px]">
                  <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 min-w-0">
                    <h3 className="text-base font-semibold text-white">Segment Fares</h3>
                    <p className="mt-1 text-sm text-white/45">
                      Update adjacent stop fares for the selected route.
                    </p>

                    <div className="mt-4 grid gap-3">
                      {segments.length > 0 ? (
                        segments.map((segment, index) => {
                          const key = getSegmentKey(segment);
                          const fromId = String(segment?.fromStationId || segment?.fromId || "");
                          const toId = String(segment?.toStationId || segment?.toId || "");
                          const fromName = stationById.get(fromId)?.name || "Station";
                          const toName = stationById.get(toId)?.name || "Station";

                          return (
                            <div
                              key={key}
                              className="grid grid-cols-[minmax(0,1fr)_110px] items-center gap-3 rounded-2xl border border-white/8 bg-black/10 px-3 py-3"
                            >
                              <div className="min-w-0 text-sm text-white/75">
                                <div className="truncate font-medium text-white">
                                  {index + 1}. {fromName} → {toName}
                                </div>
                                <div className="mt-1 text-xs text-white/35">Adjacent segment fare</div>
                              </div>

                              <input
                                type="number"
                                min={0}
                                value={segmentFares[key] || ""}
                                onChange={(e) =>
                                  setSegmentFares((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                                className="h-11 rounded-xl border border-white/10 bg-[#09101b] px-3 text-sm text-white outline-none transition focus:border-blue-400/45"
                              />
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-white/45">
                          Build or load a valid route to edit fares.
                        </div>
                      )}
                    </div>
                  </section>

                  <div className="xl:self-start">
                    <ManageScheduleActionPanel
                      busy={busy}
                      hasSelection={Boolean(selectedId)}
                      onSave={saveChanges}
                      onReset={resetEditor}
                      onDelete={deleteSelectedTrain}
                    />
                  </div>
                </aside>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}