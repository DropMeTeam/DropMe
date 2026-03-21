import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import RouteBuilder from "./components/RouteBuilder";
import TimetableBuilder from "./components/TimetableBuilder";
import RouteMapPanel from "./components/RouteMapPanel";
import { computeSegments } from "./lib/routing";

function newStop(order) {
  return { key: crypto.randomUUID(), stationId: "", order };
}

export default function TrainSchedulesPage() {
  const [stations, setStations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [mode, setMode] = useState("route"); // route | timetable

  const [editingId, setEditingId] = useState(null);
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

  const [generatedStopTimes, setGeneratedStopTimes] = useState([]); // filled by TimetableBuilder

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

  useEffect(() => { loadAll(); }, []);

  const stationById = useMemo(() => {
    const m = new Map();
    stations.forEach((s) => m.set(String(s._id), s));
    return m;
  }, [stations]);

  const stopsOrdered = useMemo(() => {
    return [...stops]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ ...s, station: s.stationId ? stationById.get(String(s.stationId)) : null }));
  }, [stops, stationById]);

  // enforce first/last station = A/B when selected
  useEffect(() => {
    if (!startId && !endId) return;
    setStops((prev) => {
      const ordered = [...prev].sort((a, b) => a.order - b.order);
      const base = ordered.length >= 2 ? ordered : [newStop(1), newStop(2)];
      const next = base.map((s) => ({ ...s }));

      if (startId) next[0].stationId = startId;
      if (endId) next[next.length - 1].stationId = endId;

      return next.map((s, idx) => ({ ...s, order: idx + 1 }));
    });
  }, [startId, endId]);

  // compute routing whenever ordered stations change
  useEffect(() => {
    (async () => {
      const orderedStations = stopsOrdered.map((s) => s.station).filter(Boolean);
      const r = await computeSegments(orderedStations);
      setSegments(r.segments);
      setRoutePolyline(r.polyline);
      setTotalKm(r.totalKm);
      setTotalMin(r.totalMin);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopsOrdered.map((s) => s.stationId).join("|")]);

  function addStop() {
    setStops((prev) => {
      const ordered = [...prev].sort((a, b) => a.order - b.order);
      const maxOrder = ordered.reduce((m, s) => Math.max(m, s.order), 0);
      return [...ordered, newStop(maxOrder + 1)];
    });
  }

  function removeStop(key) {
    setStops((prev) =>
      prev
        .filter((s) => s.key !== key)
        .sort((a, b) => a.order - b.order)
        .map((s, idx) => ({ ...s, order: idx + 1 }))
    );
  }

  function updateStopStation(key, stationId) {
    setStops((prev) => prev.map((s) => (s.key === key ? { ...s, stationId } : s)));
  }

  function addIntermediateStation(stationId) {
    if (!stationId) return;
    setStops((prev) => {
      const ordered = [...prev].sort((a, b) => a.order - b.order);
      if (ordered.some((s) => String(s.stationId) === String(stationId))) return prev;

      const last = ordered[ordered.length - 1];
      const middle = ordered.slice(1, -1);

      const next = [ordered[0], ...middle, { ...newStop(0), stationId }, last].map((s, idx) => ({ ...s, order: idx + 1 }));
      return next;
    });
  }

  function resetForm() {
    setEditingId(null);
    setTrainName("");
    setTrainNo("");
    setSeatCapacity(200);
    setActive(true);
    setStartId("");
    setEndId("");
    setStops([newStop(1), newStop(2)]);
    setMode("route");
    setGeneratedStopTimes([]);
  }

  async function saveToBackend() {
    setMsg("");
    setBusy(true);
    try {
      if (!trainNo) throw new Error("Train No is required");
      const ordered = stopsOrdered;
      if (ordered.length < 2) throw new Error("At least 2 stops required");
      if (ordered.some((s) => !s.stationId)) throw new Error("Select station for every stop");

      // IMPORTANT: backend expects arrivalTime/departureTime
      // We generate them from Timetable tab so user never manually types
      if (!generatedStopTimes || generatedStopTimes.length !== ordered.length) {
        throw new Error("Open Timetable tab and generate times before saving.");
      }
      if (generatedStopTimes.some((s, idx) => idx !== generatedStopTimes.length - 1 && !s.departureTime)) {
        throw new Error("Departure times missing. Generate timetable first.");
      }

      const payload = {
        trainName,
        trainNo,
        seatCapacity: Number(seatCapacity),
        active,
        stops: generatedStopTimes.map((s, idx) => ({
          stationId: s.stationId,
          order: idx + 1,
          arrivalTime: s.arrivalTime || "",
          departureTime: idx === 0 ? (s.departureTime || "") : (s.departureTime || ""),
        })),
      };

      if (editingId) {
        await api.put(`/api/admin/train/schedules/${editingId}`, payload);
        setMsg("Route + timetable updated");
      } else {
        await api.post("/api/admin/train/schedules", payload);
        setMsg("Route + timetable created");
      }

      await loadAll();
      resetForm();
    } catch (e) {
      setMsg(e?.response?.data?.message || e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(item) {
    setEditingId(item._id);
    setTrainName(item.trainName || "");
    setTrainNo(item.trainNo || "");
    setSeatCapacity(item.seatCapacity || 200);
    setActive(item.active ?? true);

    const mappedStops =
      (item.stops || [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          key: crypto.randomUUID(),
          stationId: String(s.stationId),
          order: s.order,
          station: stationById.get(String(s.stationId)) || null,
        })) || [];

    const safeStops = mappedStops.length >= 2 ? mappedStops : [newStop(1), newStop(2)];
    setStops(safeStops.map((s, idx) => ({ key: s.key, stationId: s.stationId, order: idx + 1 })));
    setStartId(safeStops?.[0]?.stationId || "");
    setEndId(safeStops?.[safeStops.length - 1]?.stationId || "");

    // preload timetable values from DB stops (optional)
    setGeneratedStopTimes(
      (item.stops || []).slice().sort((a,b)=>a.order-b.order).map((s) => ({
        stationId: String(s.stationId),
        order: s.order,
        arrivalTime: s.arrivalTime || "",
        departureTime: s.departureTime || "",
      }))
    );

    setMode("route");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeSchedule(id) {
    if (!confirm("Delete this route?")) return;
    setMsg("");
    setBusy(true);
    try {
      await api.delete(`/api/admin/train/schedules/${id}`);
      setMsg("Deleted");
      await loadAll();
      if (editingId === id) resetForm();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "600px 1fr", gap: 16 }}>
      <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>{editingId ? "Edit Train Route" : "Create Train Route"}</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setMode("route")} style={{ padding: "8px 12px", borderRadius: 10, border: mode === "route" ? "1px solid #111" : "1px solid #ddd" }}>
              Route Builder
            </button>
            <button type="button" onClick={() => setMode("timetable")} style={{ padding: "8px 12px", borderRadius: 10, border: mode === "timetable" ? "1px solid #111" : "1px solid #ddd" }}>
              Timetable
            </button>
          </div>
        </div>

        {msg && (
          <div style={{ background: "#fff3cd", border: "1px solid #ffeeba", padding: 10, borderRadius: 10, marginTop: 10 }}>
            {msg}
          </div>
        )}

        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label>
              Train No *
              <input value={trainNo} onChange={(e) => setTrainNo(e.target.value)} style={{ width: "100%", padding: 8 }} />
            </label>
            <label>
              Train Name
              <input value={trainName} onChange={(e) => setTrainName(e.target.value)} style={{ width: "100%", padding: 8 }} />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label>
              Seat Capacity *
              <input type="number" min={1} value={seatCapacity} onChange={(e) => setSeatCapacity(e.target.value)} style={{ width: "100%", padding: 8 }} />
            </label>
            <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 22 }}>
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Active
            </label>
          </div>

          {mode === "route" ? (
            <RouteBuilder
              stations={stations}
              startId={startId} setStartId={setStartId}
              endId={endId} setEndId={setEndId}
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

          <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 10 }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Computed metrics</div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13 }}>
              <div>Total distance: <b>{totalKm} km</b></div>
              <div>Total time: <b>{totalMin} min</b></div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button disabled={busy} type="button" onClick={saveToBackend} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #111" }}>
              {busy ? "Saving..." : editingId ? "Update Route" : "Create Route"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd" }}>
                Cancel
              </button>
            )}
          </div>
        </div>

        <hr style={{ margin: "16px 0", opacity: 0.3 }} />

        <h4 style={{ margin: 0 }}>Routes</h4>
        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          {schedules.map((sc) => (
            <div key={sc._id} style={{ border: "1px solid #eee", borderRadius: 14, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{sc.trainNo} {sc.trainName ? `• ${sc.trainName}` : ""}</div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>
                    Seats: <b>{sc.seatCapacity}</b> • Stops: <b>{sc.stops?.length || 0}</b> • Distance: <b>{sc.totalDistanceKm ?? 0} km</b>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => startEdit(sc)} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd" }}>
                    Edit
                  </button>
                  <button onClick={() => removeSchedule(sc._id)} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #f1c0c0" }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {schedules.length === 0 && (
            <div style={{ opacity: 0.7, border: "1px dashed #ddd", borderRadius: 14, padding: 12 }}>
              No routes yet.
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 14 }}>
          <h3 style={{ marginTop: 0 }}>Route Preview (Real path)</h3>
          <RouteMapPanel stopsOrdered={stopsOrdered} polyline={routePolyline} />
        </div>
      </div>
    </div>
  );
}
