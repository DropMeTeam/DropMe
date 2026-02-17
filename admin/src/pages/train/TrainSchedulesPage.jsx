import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function TrainSchedulesPage() {
  const [stations, setStations] = useState([]);
  const [msg, setMsg] = useState("");

  // basic schedule fields (we’ll expand later)
  const [trainName, setTrainName] = useState("");
  const [trainNo, setTrainNo] = useState("");
  const [seatCapacity, setSeatCapacity] = useState(200);

  const [fromStationId, setFromStationId] = useState("");
  const [toStationId, setToStationId] = useState("");
  const [departTime, setDepartTime] = useState("06:30");
  const [arriveTime, setArriveTime] = useState("07:45");

  useEffect(() => {
    (async () => {
      try {
        // You already have admin stations endpoint
        const res = await api.get("/api/admin/train/stations");
        const list = res.data.stations || [];
        setStations(list);

        // preselect first two if available
        if (list.length >= 2) {
          setFromStationId(list[0]._id);
          setToStationId(list[1]._id);
        }
      } catch (e) {
        setMsg(e?.response?.data?.message || "Failed to load stations for schedule");
      }
    })();
  }, []);

  function onSubmit(e) {
    e.preventDefault();
    // For now just demo UI. Later we’ll POST to /api/admin/train/schedules
    setMsg(
      `Saved (demo): ${trainName || "Train"} (${trainNo || "N/A"}) seats=${seatCapacity}, from=${fromStationId}, to=${toStationId}, ${departTime}→${arriveTime}`
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "520px 1fr", gap: 16 }}>
      <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Add Schedule</h3>

        {msg && (
          <div style={{ background: "#fff3cd", border: "1px solid #ffeeba", padding: 10, borderRadius: 8, marginBottom: 10 }}>
            {msg}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <label>
            Train Name
            <input value={trainName} onChange={(e) => setTrainName(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </label>

          <label>
            Train Number
            <input value={trainNo} onChange={(e) => setTrainNo(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </label>

          <label>
            Seat Capacity
            <input
              type="number"
              min={1}
              value={seatCapacity}
              onChange={(e) => setSeatCapacity(Number(e.target.value))}
              style={{ width: "100%", padding: 8 }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label>
              From Station
              <select value={fromStationId} onChange={(e) => setFromStationId(e.target.value)} style={{ width: "100%", padding: 8 }}>
                {stations.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              To Station
              <select value={toStationId} onChange={(e) => setToStationId(e.target.value)} style={{ width: "100%", padding: 8 }}>
                {stations.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label>
              Depart (HH:MM)
              <input value={departTime} onChange={(e) => setDepartTime(e.target.value)} style={{ width: "100%", padding: 8 }} />
            </label>
            <label>
              Arrive (HH:MM)
              <input value={arriveTime} onChange={(e) => setArriveTime(e.target.value)} style={{ width: "100%", padding: 8 }} />
            </label>
          </div>

          <button type="submit" style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #111", cursor: "pointer" }}>
            Save Schedule
          </button>
        </form>

        <p style={{ marginTop: 12, opacity: 0.75, fontSize: 13 }}>
          Next step: we’ll store schedules in DB + add intermediate station stops + days + seat availability.
        </p>
      </div>

      <div style={{ border: "1px dashed #ddd", borderRadius: 12, padding: 12, opacity: 0.8 }}>
        <h3 style={{ marginTop: 0 }}>Schedule List</h3>
        <p>
          We’ll connect this to backend endpoint <code>/api/admin/train/schedules</code> next.
        </p>
      </div>
    </div>
  );
}
