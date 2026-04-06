import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bus, Route, BadgeCheck } from "lucide-react";
import api from "../../lib/api";

export default function BusAdminDashboard() {
  const nav = useNavigate();

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  function pickErr(e) {
    return (
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      "Request failed"
    );
  }

  async function loadPending() {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/api/admin/bus-registrations/pending");
      setPending(data?.pending || []);
    } catch (e) {
      setErr(pickErr(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
  }, []);

  async function approve(id) {
    setErr("");
    try {
      await api.post(`/api/admin/bus-registrations/${id}/approve`, { note });
      setNote("");
      await loadPending();
    } catch (e) {
      setErr(pickErr(e));
    }
  }

  async function reject(id) {
    setErr("");
    try {
      await api.post(`/api/admin/bus-registrations/${id}/reject`, {
        note: note || "Rejected",
      });
      setNote("");
      await loadPending();
    } catch (e) {
      setErr(pickErr(e));
    }
  }

  return (
    <div className="p-6 grid gap-4">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Bus Admin</h1>
          </div>
          <div className="text-sm text-zinc-400">
            Module: Routes • Schedules • Approvals
          </div>
        </div>

        <p className="mt-2 text-sm text-zinc-400">
          Operational governance console: manage route master-data, execute fleet
          onboarding approvals, and review pending bus registrations.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn" onClick={() => nav("/bus/routes")}>
            <Route className="h-4 w-4" />
            <span className="ml-2">Manage Bus Routes</span>
          </button>

          <button className="btn" onClick={() => nav("/bus/approvals")}>
            <BadgeCheck className="h-4 w-4" />
            <span className="ml-2">Approve Bus Registrations</span>
          </button>

          <button className="btn" onClick={() => nav("/bus/schedules")}>
            Manage Schedules
          </button>

          <button className="btn" onClick={loadPending} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh Pending"}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input
            className="input flex-1"
            placeholder="Decision note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {err ? <div className="mt-3 text-sm text-red-300">{err}</div> : null}

        <div className="mt-5 rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="font-semibold mb-2">Operational Workflow</div>
          <div className="text-sm text-zinc-400 leading-6">
            1) Create bus routes (NORMAL / EXPRESS) with start, end, and ordered
            stops. <br />
            2) Owners register buses to a route. <br />
            3) Admin approves or rejects onboarding requests. <br />
            4) Admin publishes schedules per route.
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold">Pending Bus Registrations</h2>
          <div className="text-xs text-zinc-400">
            {loading ? "Loading…" : `${pending.length} item(s)`}
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {pending.map((b) => (
            <div key={b._id} className="rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">{b?.plateNumber || "—"}</div>
                <div className="text-xs text-amber-300 border border-amber-400/30 rounded-full px-2 py-1">
                  PENDING
                </div>
              </div>

              <div className="mt-2 text-sm text-zinc-400">
                Owner: {b?.owner?.name || "—"} • {b?.owner?.email || "—"}
              </div>
              <div className="mt-1 text-sm text-zinc-400">
                Type: {b?.busType || "—"} • Seats: {b?.seatsTotal ?? "—"} •
                Color: {b?.color || "-"}
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  className="btn btn-primary"
                  onClick={() => approve(b._id)}
                  disabled={loading}
                >
                  Approve
                </button>
                <button
                  className="btn"
                  onClick={() => reject(b._id)}
                  disabled={loading}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}

          {!loading && pending.length === 0 ? (
            <div className="text-sm text-zinc-400">
              No pending registrations right now.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}