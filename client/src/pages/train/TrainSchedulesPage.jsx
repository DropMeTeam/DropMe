import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";

import "./components/schedules/train-schedules-theme.css";
import RouteBuilder from "./components/schedules/RouteBuilder";
import TimetableBuilder from "./components/schedules/TimetableBuilder";
import TrainSchedulesHeader from "./components/schedules/TrainSchedulesHeader";
import TrainDetailsCard from "./components/schedules/TrainDetailsCard";
import ScheduleAlert from "./components/schedules/ScheduleAlert";
import SegmentFaresCard from "./components/schedules/SegmentFaresCard";
import ScheduleActionBar from "./components/schedules/ScheduleActionBar";
import RoutePreviewPanel from "./components/schedules/RoutePreviewPanel";

import { computeSegments } from "./lib/routing";

function uid() {
  return globalThis.crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function newStop(order) {
  return { key: uid(), stationId: "", order };
}

export default function TrainSchedulesPage() {
  const [stations, setStations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [mode, setMode] = useState("route");

  const [trainName, setTrainName] = useState("");
  const [trainNo, setTrainNo] = useState("");
  const [seatCapacity, setSeatCapacity] = useState(200);
  const [active, setActive] = useState(true);

  const [startId, setStartId] = useState("");
  const [endId, setEndId] = useState("");
  const [stops, setStops] = useState([newStop(1), newStop(2)]);

  const [segments, setSegments] = useState([]);
  const [routePolyline, setRoutePolyline] = useState([]);
  const [totalKm, setTotalKm] = useState(0);
  const [totalMin, setTotalMin] = useState(0);

  const [segmentFares, setSegmentFares] = useState({});
  const [generatedStopTimes, setGeneratedStopTimes] = useState([]);

  async function loadAll() {
    setMsg("");
    try {
      const [stRes, scRes] = await Promise.all([
        api.get("/api/admin/train/stations"),
        api.get("/api/admin/train/schedules"),
      ]);
      setStations(stRes.data.stations || []);
      setSchedules(scRes.data.schedules || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load stations/schedules");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const stationById = useMemo(() => {
    const map = new Map();
    stations.forEach((station) => map.set(String(station._id), station));
    return map;
  }, [stations]);

  const stopsOrdered = useMemo(() => {
    return [...stops]
      .sort((a, b) => a.order - b.order)
      .map((stop) => ({
        ...stop,
        station: stop.stationId ? stationById.get(String(stop.stationId)) : null,
      }));
  }, [stops, stationById]);

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
        setRoutePolyline(result.polyline || []);
        setTotalKm(result.totalKm || 0);
        setTotalMin(result.totalMin || 0);
      } catch {
        if (!cancelled) {
          setSegments([]);
          setRoutePolyline([]);
          setTotalKm(0);
          setTotalMin(0);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stopsKey]);

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

  function resetForm() {
    setTrainName("");
    setTrainNo("");
    setSeatCapacity(200);
    setActive(true);
    setStartId("");
    setEndId("");
    setStops([newStop(1), newStop(2)]);
    setMode("route");
    setGeneratedStopTimes([]);
    setSegmentFares({});
    setMsg("");
  }

  function getSegmentKey(seg) {
    const fromId = String(seg.fromStationId || seg.fromId || "");
    const toId = String(seg.toStationId || seg.toId || "");
    return `${fromId}-${toId}`;
  }

  async function saveToBackend() {
    setMsg("");
    setBusy(true);

    try {
      if (!trainNo.trim()) throw new Error("Train No is required");

      const ordered = stopsOrdered;
      if (ordered.length < 2) throw new Error("At least 2 stops required");
      if (ordered.some((stop) => !stop.stationId)) throw new Error("Select station for every stop");

      if (!generatedStopTimes || generatedStopTimes.length !== ordered.length) {
        throw new Error("Open Timetable tab and generate times before saving.");
      }
      if (generatedStopTimes.some((stop) => !stop.departureTime)) {
        throw new Error("Departure times missing. Generate timetable first.");
      }

      const faresArr = segments.map((seg) => {
        const key = getSegmentKey(seg);
        const val = Number(segmentFares[key] || 0);
        if (Number.isNaN(val) || val < 0) {
          throw new Error(`Invalid fare for segment: ${key}`);
        }
        return val;
      });

      const payload = {
        trainName,
        trainNo: trainNo.trim(),
        seatCapacity: Number(seatCapacity),
        active,
        stops: generatedStopTimes.map((stop, index) => ({
          stationId: stop.stationId,
          order: index + 1,
          arrivalTime: stop.arrivalTime || "",
          departureTime: stop.departureTime || "",
        })),
        segmentFares: faresArr,
      };

      await api.post("/api/admin/train/schedules", payload);
      setMsg("Route + timetable created");

      await loadAll();
      resetForm();
    } catch (e) {
      setMsg(e?.response?.data?.message || e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const scheduleStats = useMemo(
    () => ({
      stationCount: stations.length,
      scheduleCount: schedules.length,
      activeCount: schedules.filter((schedule) => schedule.active).length,
      segmentCount: segments.length,
    }),
    [stations, schedules, segments]
  );

  return (
    <div className="train-schedules-shell min-h-full bg-[#040914] px-1 py-1 text-white md:px-2">
      <div className="grid w-full min-w-0 gap-4 2xl:gap-5">
        <section className="space-y-5 min-w-0">
          <TrainSchedulesHeader
            stationCount={scheduleStats.stationCount}
            scheduleCount={scheduleStats.scheduleCount}
            activeCount={scheduleStats.activeCount}
          />

          {msg ? <ScheduleAlert message={msg} /> : null}

          <TrainDetailsCard
            trainNo={trainNo}
            setTrainNo={setTrainNo}
            trainName={trainName}
            setTrainName={setTrainName}
            seatCapacity={seatCapacity}
            setSeatCapacity={setSeatCapacity}
            active={active}
            setActive={setActive}
          />

          <div className="grid gap-4 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(21,30,43,0.96)_0%,rgba(11,17,27,0.96)_100%)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.32)] xl:grid-cols-[minmax(0,1.2fr)_300px]">
            <section className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">Create Railway Schedule</h2>
                  <p className="mt-1 text-sm text-white/45">
                    Build the station path first, then switch to timetable and generate departure flow.
                  </p>
                </div>

                <div className="inline-flex rounded-2xl border border-white/10 bg-black/20 p-1">
                  <button
                    type="button"
                    onClick={() => setMode("route")}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                      mode === "route"
                        ? "bg-blue-500/20 text-blue-100 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.35)]"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    Route Builder
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("timetable")}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                      mode === "timetable"
                        ? "bg-blue-500/20 text-blue-100 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.35)]"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    Timetable
                  </button>
                </div>
              </div>

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
              ) : (
                <TimetableBuilder
                  stopsOrdered={stopsOrdered}
                  segments={segments}
                  defaultDwell={20}
                  onGeneratedTimesChange={setGeneratedStopTimes}
                />
              )}
            </section>

            <aside className="space-y-4 xl:border-l xl:border-white/10 xl:pl-5">
              <SegmentFaresCard
                segments={segments}
                stationById={stationById}
                segmentFares={segmentFares}
                setSegmentFares={setSegmentFares}
              />

              <ScheduleActionBar
                busy={busy}
                onSave={saveToBackend}
                onReset={resetForm}
              />
            </aside>
          </div>
        </section>

        <section className="min-w-0">
          <RoutePreviewPanel
            stopsOrdered={stopsOrdered}
            polyline={routePolyline}
            totalKm={totalKm}
            totalMin={totalMin}
            stopCount={stopsOrdered.filter((stop) => stop.stationId).length}
            segmentCount={scheduleStats.segmentCount}
          />
        </section>
      </div>
    </div>
  );
}