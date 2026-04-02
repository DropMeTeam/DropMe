import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../lib/api";

export default function BusRoutesPage() {
  const nav = useNavigate();
  const location = useLocation();

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState(null);
  const [toast, setToast] = useState(null);

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

  // Read success message from navigation state
  useEffect(() => {
    if (location.state?.success) {
      setToast(location.state.success);

      // clear route state so toast won't reappear on refresh/back
      nav(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, nav]);

  // Auto hide toast after 10 seconds
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast]);

  async function onDelete(id) {
    if (!confirm("Delete this route? This cannot be undone.")) return;
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

  return (
    <div style={{ padding: 16, display: "grid", gap: 12, position: "relative" }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            minWidth: 260,
            maxWidth: 360,
            padding: "14px 16px",
            borderRadius: 12,
            border: "1px solid #c7f2d0",
            background: "#f2fff5",
            color: "#000",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            fontWeight: 600
          }}
        >
          {toast}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => nav("/bus")}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
          >
            ← Back
          </button>
          <h2 style={{ margin: 0 }}>Bus Routes</h2>
        </div>

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
        <div
          style={{
            padding: 10,
            borderRadius: 10,
            border: "1px solid #ffd1d1",
            background: "#fff5f5",
            color: "#000"
          }}
        >
          {err}
        </div>
      )}

      {!loading && routes.length === 0 && <div style={{ opacity: 0.7 }}>No routes created yet.</div>}

      {routes.length > 0 && (
        <div style={{ border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "140px 110px 1fr 1fr 90px 120px 140px",
              padding: 10,
              fontWeight: 700,
              background: "#000",
              color: "#fff"
            }}
          >
            <div>Route No</div>
            <div>Type</div>
            <div>Start</div>
            <div>End</div>
            <div>Stops</div>
            <div>Distance</div>
            <div>Actions</div>
          </div>

          {routes.map((r) => (
            <div
              key={r._id}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 110px 1fr 1fr 90px 120px 140px",
                padding: 10,
                borderTop: "1px solid #f2f2f2",
                alignItems: "center"
              }}
            >
              <div style={{ fontWeight: 700 }}>{r.routeNumber}</div>
              <div>{r.routeType}</div>

              <div
                title={r.start?.label}
                style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {r.start?.label}
              </div>

              <div
                title={r.end?.label}
                style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {r.end?.label}
              </div>

              <div>{Array.isArray(r.stops) ? r.stops.length : 0}</div>
              <div>{r.distanceKm ? `${Number(r.distanceKm).toFixed(2)} km` : "-"}</div>

              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" onClick={() => nav(`/bus/routes/${r._id}`)}>
                  View/Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(r._id)}
                  disabled={busyId === r._id}
                  style={{ opacity: busyId === r._id ? 0.6 : 1 }}
                >
                  {busyId === r._id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}