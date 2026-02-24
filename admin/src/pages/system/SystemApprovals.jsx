import { useEffect, useState } from "react";
import api from "../../lib/api";
import { useAuth } from "../../state/AuthContext";

export default function SystemApprovals() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/api/admin/approvals");
      setPending(res.data.pending || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }

  async function approve(id) {
    setMsg("");
    try {
      await api.post(`/api/admin/approvals/${id}/approve`);
      setPending((prev) => prev.filter((u) => u._id !== id));
    } catch (e) {
      setMsg(e?.response?.data?.message || "Approve failed");
    }
  }

  async function deny(id) {
    setMsg("");
    try {
      await api.post(`/api/admin/approvals/${id}/deny`);
      setPending((prev) => prev.filter((u) => u._id !== id));
    } catch (e) {
      setMsg(e?.response?.data?.message || "Deny failed");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (user?.role !== "SYSTEM_ADMIN") {
    return (
      <div style={{ padding: 16 }}>
        <h3>Forbidden</h3>
        <p>Only <b>SYSTEM_ADMIN</b> can access approvals.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0 }}>System Admin Dashboard</h2>
        <button
          onClick={load}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Approve or deny admin registration requests (Train / Bus / Private).
      </p>

      {msg && (
        <div style={{ background: "#fff3cd", border: "1px solid #ffeeba", padding: 10, borderRadius: 8, marginBottom: 10 }}>
          {msg}
        </div>
      )}

      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
        {pending.map((u) => (
          <div key={u._id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800 }}>
                  {u.name} <span style={{ fontWeight: 600, opacity: 0.7 }}>({u.role})</span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>{u.email}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  Status: <b>{u.adminStatus}</b>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => approve(u._id)}
                  style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #b7e4c7", cursor: "pointer" }}
                >
                  Approve
                </button>
                <button
                  onClick={() => deny(u._id)}
                  style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #f1c0c0", cursor: "pointer" }}
                >
                  Deny
                </button>
              </div>
            </div>
          </div>
        ))}

        {pending.length === 0 && !loading && (
          <div style={{ opacity: 0.7, border: "1px dashed #ddd", borderRadius: 12, padding: 14 }}>
            No pending admin requests.
          </div>
        )}
      </div>
    </div>
  );
}
