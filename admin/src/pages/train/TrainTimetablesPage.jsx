import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api"; // ✅ matches your existing TrainSchedulesPage import style

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function normalizeStop(s) {
  const stationId = s?.stationId?._id ? String(s.stationId._id) : String(s.stationId);
  const stationName = s?.stationId?.name || s?.stationName || "Station";
  return {
    stationId,
    stationName,
    order: Number(s.order),
    arrivalTime: s.arrivalTime || "",
    departureTime: s.departureTime || "",
  };
}

function buildWeek(schedule) {
  const baseStops = (schedule?.stops || []).slice().sort((a,b)=>a.order-b.order).map(normalizeStop);

  const week = {};
  for (const d of DAYS) {
    const day = schedule?.weeklyTimetable?.[d];
    if (Array.isArray(day) && day.length) {
      week[d] = day.slice().sort((a,b)=>a.order-b.order).map(normalizeStop);
    } else {
      // default = same times for all days from base stops
      week[d] = baseStops.map((x) => ({ ...x }));
    }
  }
  return week;
}

export default function TrainTimetablesPage() {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [schedules, setSchedules] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [week, setWeek] = useState(() => {
    const w = {};
    for (const d of DAYS) w[d] = [];
    return w;
  });

  async function load() {
    setMsg("");
    try {
      const res = await api.get("/api/admin/train/schedules");
      setSchedules(res.data.schedules || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load schedules");
    }
  }

  useEffect(() => { load(); }, []);

  const selected = useMemo(
    () => schedules.find((s) => String(s._id) === String(selectedId)),
    [schedules, selectedId]
  );

  useEffect(() => {
    if (!selected) return;
    setWeek(buildWeek(selected));
  }, [selected]);

  function setCell(day, idx, field, val) {
    setWeek((prev) => {
      const copy = { ...prev };
      const rows = copy[day].map((r) => ({ ...r }));
      rows[idx][field] = val;
      copy[day] = rows;
      return copy;
    });
  }

  async function saveTimetable() {
    if (!selected) return;
    setMsg("");
    setBusy(true);
    try {
      // backend expects same stations/order as route stops + departureTime required
      for (const d of DAYS) {
        for (const r of week[d]) {
          if (!r.departureTime) throw new Error(`${d}: departureTime required for all stops`);
        }
      }

      const payloadWeekly = {};
      for (const d of DAYS) {
        payloadWeekly[d] = week[d].map((r) => ({
          stationId: r.stationId,
          order: r.order,
          arrivalTime: r.arrivalTime || "",
          departureTime: r.departureTime || (r.arrivalTime || ""), // safe
        }));
      }

      await api.put(`/api/admin/train/schedules/${selected._id}`, {
        weeklyTimetable: payloadWeekly,
      });

      setMsg("Timetable saved");
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.message || e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteTrain(id) {
    if (!confirm("Delete this train schedule?")) return;
    setMsg("");
    setBusy(true);
    try {
      await api.delete(`/api/admin/train/schedules/${id}`);
      setSelectedId("");
      setMsg("Deleted");
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 16 }}>
      <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 14 }}>
        <h3 style={{ marginTop: 0 }}>Train List</h3>

        {msg && (
          <div style={{ background: "#fff3cd", border: "1px solid #ffeeba", padding: 10, borderRadius: 10, marginBottom: 10 }}>
            {msg}
          </div>
        )}

        <div style={{ display: "grid", gap: 10 }}>
          {schedules.map((sc) => (
            <div
              key={sc._id}
              style={{
                border: "1px solid #eee",
                borderRadius: 14,
                padding: 12,
                background: selectedId === sc._id ? "#f7f7f7" : "transparent",
                cursor: "pointer",
              }}
              onClick={() => setSelectedId(sc._id)}
            >
              <div style={{ fontWeight: 900 }}>
                {sc.trainNo} {sc.trainName ? `• ${sc.trainName}` : ""}
              </div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                Seats: <b>{sc.seatCapacity}</b> • Stops: <b>{sc.stops?.length || 0}</b> • Distance:{" "}
                <b>{sc.totalDistanceKm ?? 0} km</b>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(sc._id);
                  }}
                  style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd" }}
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTrain(sc._id);
                  }}
                  style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #f1c0c0" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {schedules.length === 0 && (
            <div style={{ opacity: 0.7, border: "1px dashed #ddd", borderRadius: 14, padding: 12 }}>
              No trains yet.
            </div>
          )}
        </div>
      </div>

      <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 14 }}>
        <h3 style={{ marginTop: 0 }}>Weekly Timetable (Mon–Sun)</h3>

        {!selected ? (
          <div style={{ opacity: 0.8 }}>Select a train from the left.</div>
        ) : (
          <>
            <div style={{ marginBottom: 10, opacity: 0.85 }}>
              Editing: <b>{selected.trainNo}</b> {selected.trainName ? `• ${selected.trainName}` : ""}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <button
                disabled={busy}
                onClick={saveTimetable}
                style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #111" }}
              >
                {busy ? "Saving..." : "Save Timetable"}
              </button>
            </div>

            {DAYS.map((day) => (
              <div key={day} style={{ border: "1px solid #f0f0f0", borderRadius: 14, padding: 12, marginTop: 12 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>{day}</div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.6fr 0.6fr", gap: 8, fontWeight: 800, opacity: 0.8 }}>
                  <div>Pickup Station</div>
                  <div>Arrival</div>
                  <div>Departure</div>
                </div>

                {(week[day] || []).map((r, idx) => (
                  <div
                    key={`${day}-${r.stationId}-${idx}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 0.6fr 0.6fr",
                      gap: 8,
                      marginTop: 8,
                      padding: 8,
                      border: "1px solid #f6f6f6",
                      borderRadius: 12,
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>{idx + 1}. {r.stationName}</div>

                    <input
                      type="time"
                      value={r.arrivalTime}
                      onChange={(e) => setCell(day, idx, "arrivalTime", e.target.value)}
                      style={{ padding: 6 }}
                    />

                    <input
                      type="time"
                      value={r.departureTime}
                      onChange={(e) => setCell(day, idx, "departureTime", e.target.value)}
                      style={{ padding: 6 }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
