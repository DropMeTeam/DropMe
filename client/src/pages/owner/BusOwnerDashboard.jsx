import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../state/AuthContext";

export default function BusOwnerDashboard() {
  const { user } = useAuth();

  const [tab, setTab] = useState("profile");
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    busName: "",
    plateNumber: "",
    busType: "Normal",
    seatsTotal: 40,
    color: "",
    photoUrl: "",
  });

  async function loadBuses() {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/api/bus-owner/buses");
      setBuses(data.buses || []);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.error || "Failed to load buses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBuses();
  }, []);

  async function submitBus(e) {
    e.preventDefault();
    setErr("");
    try {
      await api.post("/api/bus-owner/buses", form);
      setForm({ busName: "", plateNumber: "", busType: "Normal", seatsTotal: 40, color: "", photoUrl: "" });
      setTab("mybuses");
      await loadBuses();
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2?.response?.data?.error || "Bus submit failed");
    }
  }

  return (
    <div className="p-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Bus Owner Workspace</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Fleet onboarding + compliance lifecycle (pending → approved/rejected).
            </p>
          </div>

          <div className="flex gap-2">
            <button className={`btn ${tab === "profile" ? "btn-primary" : ""}`} onClick={() => setTab("profile")}>
              Profile
            </button>
            <button className={`btn ${tab === "add" ? "btn-primary" : ""}`} onClick={() => setTab("add")}>
              Add Vehicle
            </button>
            <button className={`btn ${tab === "mybuses" ? "btn-primary" : ""}`} onClick={() => setTab("mybuses")}>
              My Buses
            </button>
          </div>
        </div>
      </div>

      {err ? <div className="mt-4 text-sm text-red-300">{err}</div> : null}

      {tab === "profile" ? (
        <div className="card mt-4 p-6">
          <h2 className="text-lg font-semibold">Owner Details</h2>
          <div className="mt-3 grid gap-2 text-sm text-zinc-300">
            <div><span className="text-zinc-400">Name:</span> {user?.name}</div>
            <div><span className="text-zinc-400">Email:</span> {user?.email}</div>
            <div><span className="text-zinc-400">Role:</span> {user?.role}</div>
          </div>
        </div>
      ) : null}

      {tab === "add" ? (
        <div className="card mt-4 p-6">
          <h2 className="text-lg font-semibold">Add Bus (Pending Approval)</h2>
          <form className="mt-4 grid gap-3 max-w-xl" onSubmit={submitBus}>
            <input
              className="input"
              placeholder="Bus Name (optional)"
              value={form.busName}
              onChange={(e) => setForm({ ...form, busName: e.target.value })}
            />
            <input
              className="input"
              placeholder="Plate Number (required)"
              value={form.plateNumber}
              onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
              required
            />
            <select
              className="input"
              value={form.busType}
              onChange={(e) => setForm({ ...form, busType: e.target.value })}
            >
              <option value="Normal">Normal</option>
              <option value="AC">AC</option>
              <option value="Non-AC">Non-AC</option>
              <option value="Luxury">Luxury</option>
            </select>
            <input
              className="input"
              type="number"
              min={1}
              placeholder="Total Seats"
              value={form.seatsTotal}
              onChange={(e) => setForm({ ...form, seatsTotal: Number(e.target.value) })}
              required
            />
            <input
              className="input"
              placeholder="Color (optional)"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
            <input
              className="input"
              placeholder="Bus Photo URL (optional for now)"
              value={form.photoUrl}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
            />

            <button className="btn btn-primary" type="submit">Submit for Approval</button>
          </form>
        </div>
      ) : null}

      {tab === "mybuses" ? (
        <div className="card mt-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Buses</h2>
            <button className="btn" onClick={loadBuses} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {buses.map((b) => (
              <div key={b._id} className="rounded-xl border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    {b.plateNumber} {b.busName ? `• ${b.busName}` : ""}
                  </div>
                  <div className="text-sm">
                    <StatusBadge status={b.status} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-zinc-400">
                  Type: {b.busType} • Seats: {b.seatsTotal} • Color: {b.color || "-"}
                </div>

                {b.status === "approved" ? (
                  <div className="mt-2 text-sm text-emerald-300">
                    ✅ Vehicle registered successfully (approved by bus admin)
                  </div>
                ) : null}

                {b.status === "rejected" ? (
                  <div className="mt-2 text-sm text-red-300">
                    ❌ Rejected: {b.reviewNote || "No reason provided"}
                  </div>
                ) : null}

                {b.status === "pending" ? (
                  <div className="mt-2 text-sm text-amber-300">
                    ⏳ Pending admin review
                  </div>
                ) : null}
              </div>
            ))}

            {!loading && buses.length === 0 ? (
              <div className="text-sm text-zinc-400">No buses submitted yet.</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }) {
  const base = "px-2 py-1 rounded-full text-xs border";
  if (status === "approved") return <span className={`${base} border-emerald-400/30 text-emerald-300`}>APPROVED</span>;
  if (status === "rejected") return <span className={`${base} border-red-400/30 text-red-300`}>REJECTED</span>;
  return <span className={`${base} border-amber-400/30 text-amber-300`}>PENDING</span>;
}