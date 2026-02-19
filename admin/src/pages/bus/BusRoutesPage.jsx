import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";

export default function BusRoutesPage() {
  const nav = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

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

  async function onDelete(id) {
    if (!confirm("Delete this route?")) return;
    try {
      await api.delete(`/api/bus/routes/${id}`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Delete failed");
    }
  }

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Bus Routes</h2>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => nav("/bus/routes/new")}
            style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd", cursor: "pointer" }}
          >
            + Create Bus Route
          </button>
          <button
            onClick={load}
            style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd", cursor: "pointer" }}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <div>Loading...</div>}

      {err && (
        <div style={{ padding: 10, borderRadius: 10, border: "1px solid #ffd1d1", background: "#fff5f5" }}>
          {err}
        </div>
      )}

      {!loading && routes.length === 0 && <div style={{ opacity: 0.7 }}>No routes created yet.</div>}

      {routes.length > 0 && (
        <div style={{ border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "140px 110px 1fr 1fr 120px",
              padding: 10,
              fontWeight: 700,
              background: "#fafafa"
            }}
          >
            <div>Route No</div>
            <div>Type</div>
            <div>Start</div>
            <div>End</div>
            <div>Actions</div>
          </div>

          {routes.map((r) => (
            <div
              key={r._id}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 110px 1fr 1fr 120px",
                padding: 10,
                borderTop: "1px solid #f2f2f2",
                alignItems: "center"
              }}
            >
              <div style={{ fontWeight: 700 }}>{r.routeNumber}</div>
              <div>{r.routeType}</div>
              <div title={r.start?.label}>{r.start?.label}</div>
              <div title={r.end?.label}>{r.end?.label}</div>

              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" onClick={() => nav(`/bus/routes/${r._id}`)}>
                  View/Edit
                </button>
                <button type="button" onClick={() => onDelete(r._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
