import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../state/AuthContext";

export default function BusOwnerDashboard() {
  const { user } = useAuth();

  const [tab, setTab] = useState("profile");
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    plateNumber: "",
    busType: "Normal",
    seatsTotal: 40,
    color: "",
    routeId: "",
  });

  const [busPhoto, setBusPhoto] = useState(null);
  const [registrationPhoto, setRegistrationPhoto] = useState(null);
  const [permitPhoto, setPermitPhoto] = useState(null);

  async function loadBuses() {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/api/bus-owner/buses");
      setBuses(data?.buses || []);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.error || "Failed to load buses");
    } finally {
      setLoading(false);
    }
  }

  async function loadRoutes() {
    setLoadingRoutes(true);
    setErr("");
    try {
      const { data } = await api.get("/api/bus/routes");
      const list = Array.isArray(data) ? data : (data?.routes || []);
      setRoutes(list);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.error || "Failed to load routes");
    } finally {
      setLoadingRoutes(false);
    }
  }

  useEffect(() => {
    loadBuses();
    loadRoutes();
  }, []);

  function setField(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function submitBus(e) {
    e.preventDefault();
    setErr("");

    const seats = Number(form.seatsTotal);
    if (!Number.isFinite(seats) || seats < 25 || seats > 60) {
      return setErr("Seats must be between 25 and 60");
    }
    if (!form.plateNumber?.trim()) return setErr("Bus registration number (plateNumber) is required");
    if (!form.routeId) return setErr("Please select a bus route");
    if (!busPhoto) return setErr("Bus photo is required");
    if (!registrationPhoto) return setErr("Bus registration photo is required");
    if (!permitPhoto) return setErr("Bus permit photo is required");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("plateNumber", form.plateNumber.trim().toUpperCase());
      fd.append("busType", form.busType);
      fd.append("color", form.color || "");
      fd.append("seatsTotal", String(seats));
      fd.append("routeId", form.routeId);

      fd.append("busPhoto", busPhoto);
      fd.append("registrationPhoto", registrationPhoto);
      fd.append("permitPhoto", permitPhoto);

      await api.post("/api/bus-owner/buses", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // reset & redirect user flow to My Buses
      setForm({ plateNumber: "", busType: "Normal", seatsTotal: 40, color: "", routeId: "" });
      setBusPhoto(null);
      setRegistrationPhoto(null);
      setPermitPhoto(null);

      setTab("mybuses");
      await loadBuses();
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2?.response?.data?.error || "Bus submit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold">Bus Owner Workspace</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Fleet onboarding + compliance lifecycle (pending → approved/rejected).
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              className={`btn ${tab === "profile" ? "btn-primary" : ""}`}
              onClick={() => setTab("profile")}
            >
              Profile
            </button>

            <button
              type="button"
              className={`btn ${tab === "add" ? "btn-primary" : ""}`}
              onClick={() => {
                setTab("add");
                if (routes.length === 0) loadRoutes();
              }}
            >
              Add Bus
            </button>

            <button
              type="button"
              className={`btn ${tab === "mybuses" ? "btn-primary" : ""}`}
              onClick={() => setTab("mybuses")}
            >
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
          <h2 className="text-lg font-semibold">Add Bus (Submit for Approval)</h2>

          <form className="mt-4 grid gap-3 max-w-xl" onSubmit={submitBus}>
            <input
              className="input"
              placeholder="Bus registration number (plate number)"
              value={form.plateNumber}
              onChange={(e) => setField("plateNumber", e.target.value)}
              required
            />

            <select className="input" value={form.busType} onChange={(e) => setField("busType", e.target.value)}>
              <option value="Normal">Normal</option>
              <option value="Semi-luxury">Semi-luxury</option>
              <option value="Luxury">Luxury</option>
              <option value="Expressway">Expressway</option>
            </select>

            <input
              className="input"
              placeholder="Bus color"
              value={form.color}
              onChange={(e) => setField("color", e.target.value)}
            />

            <input
              className="input"
              type="number"
              min={25}
              max={60}
              placeholder="Number of seats (25–60)"
              value={form.seatsTotal}
              onChange={(e) => setField("seatsTotal", e.target.value)}
              required
            />

            <select
              className="input"
              value={form.routeId}
              onChange={(e) => setField("routeId", e.target.value)}
              required
              disabled={loadingRoutes}
            >
              <option value="">{loadingRoutes ? "Loading routes…" : "Select bus route"}</option>
              {routes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.routeNumber} • {r.start?.label} → {r.end?.label} ({r.routeType})
                </option>
              ))}
            </select>

            <div className="grid gap-1">
              <label className="text-sm text-zinc-400">Bus Photo</label>
              <input className="input" type="file" accept="image/*" onChange={(e) => setBusPhoto(e.target.files?.[0] || null)} />
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-zinc-400">Bus Registration Photo</label>
              <input className="input" type="file" accept="image/*" onChange={(e) => setRegistrationPhoto(e.target.files?.[0] || null)} />
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-zinc-400">Bus Permit Photo</label>
              <input className="input" type="file" accept="image/*" onChange={(e) => setPermitPhoto(e.target.files?.[0] || null)} />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Submitting…" : "Submit for Approval"}
            </button>
          </form>
        </div>
      ) : null}

      {tab === "mybuses" ? (
        <div className="card mt-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Buses</h2>
            <button className="btn" type="button" onClick={loadBuses} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {buses.map((b) => (
              <div key={b._id} className="rounded-xl border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{b.plateNumber}</div>
                  <div className="text-sm"><StatusBadge status={b.status} /></div>
                </div>

                <div className="mt-2 text-sm text-zinc-400">
                  Type: {b.busType} • Seats: {b.seatsTotal} • Color: {b.color || "-"}
                </div>

                {b.routeId ? (
                  <div className="mt-1 text-sm text-zinc-400">
                    Route: {b.routeId?.routeNumber ? `${b.routeId.routeNumber} • ` : ""}{b.routeId?.start?.label} → {b.routeId?.end?.label}
                  </div>
                ) : null}

                {b.status === "approved" ? (
                  <div className="mt-2 text-sm text-emerald-300">✅ Approved</div>
                ) : null}

                {b.status === "rejected" ? (
                  <div className="mt-2 text-sm text-red-300">❌ Rejected: {b.reviewNote || "No reason provided"}</div>
                ) : null}

                {b.status === "pending" ? (
                  <div className="mt-2 text-sm text-amber-300">⏳ Pending admin review</div>
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