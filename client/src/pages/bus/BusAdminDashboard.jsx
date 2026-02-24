import { useEffect, useState } from "react";
import { Bus } from "lucide-react";
import { api } from "../../lib/api";

export default function BusAdminDashboard() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  async function loadPending() {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/api/admin/bus-registrations/pending");
      setPending(data.pending || []);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.error || "Failed to load pending registrations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
  }, []);

  async function approve(id) {
    await api.post(`/api/admin/bus-registrations/${id}/approve`, { note });
    setNote("");
    await loadPending();
  }

  async function reject(id) {
    await api.post(`/api/admin/bus-registrations/${id}/reject`, { note: note || "Rejected" });
    setNote("");
    await loadPending();
  }

  return (
    <div className="p-6">
      <div className="card p-6">
        <div className="flex items-center gap-2">
          <Bus className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Bus Admin</h1>
        </div>

        <p className="mt-2 text-sm text-zinc-400">
          Fleet onboarding governance: review pending bus registrations and execute approve/reject decisions.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button className="btn" onClick={loadPending} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>

          <input
            className="input flex-1"
            placeholder="Decision note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {err ? <div className="mt-3 text-sm text-red-300">{err}</div> : null}
      </div>

      <div className="card mt-4 p-6">
        <h2 className="text-lg font-semibold">Pending Bus Registrations</h2>

        <div className="mt-4 grid gap-3">
          {pending.map((b) => (
            <div key={b._id} className="rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{b.plateNumber}</div>
                <div className="text-xs text-amber-300 border border-amber-400/30 rounded-full px-2 py-1">
                  PENDING
                </div>
              </div>

              <div className="mt-2 text-sm text-zinc-400">
                Owner: {b?.owner?.name} • {b?.owner?.email}
              </div>
              <div className="mt-1 text-sm text-zinc-400">
                Type: {b.busType} • Seats: {b.seatsTotal} • Color: {b.color || "-"}
              </div>

              <div className="mt-3 flex gap-2">
                <button className="btn btn-primary" onClick={() => approve(b._id)}>
                  Approve
                </button>
                <button className="btn" onClick={() => reject(b._id)}>
                  Reject
                </button>
              </div>
            </div>
          ))}

          {!loading && pending.length === 0 ? (
            <div className="text-sm text-zinc-400">No pending registrations right now.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}