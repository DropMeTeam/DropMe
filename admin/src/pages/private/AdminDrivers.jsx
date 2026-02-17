import { useEffect, useState } from "react";
import api from "../../lib/api"; // ✅ your admin axios instance

export default function AdminDrivers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/api/private-admin/drivers/pending");
      setItems(res.data?.items || []);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to load pending drivers");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id) {
    if (!confirm("Approve this driver and generate Driver ID?")) return;
    setBusyId(id);
    try {
      await api.post(`/api/private-admin/drivers/${id}/approve`);
      await load();
      alert("Approved ✅ Driver ID generated and email dispatched (if SMTP configured).");
    } catch (e) {
      alert(e?.response?.data?.message || "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id) {
    if (!confirm("Reject this driver registration?")) return;
    setBusyId(id);
    try {
      await api.post(`/api/private-admin/drivers/${id}/reject`);
      await load();
      alert("Rejected ✅");
    } catch (e) {
      alert(e?.response?.data?.message || "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#060812] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Pending Driver Approvals</h1>
            <p className="mt-1 text-sm text-white/60">
              Review driver + vehicle details. Approve to generate Driver ID (D/YYYY/seq).
            </p>
          </div>

          <button
            onClick={load}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
              Loading pending drivers...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
              No pending registrations.
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map((d) => {
                const user = d.userId || {};
                const vehicle = d.vehicle || {};
                const disabled = busyId === d._id;

                return (
                  <div
                    key={d._id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      {/* Left: identity */}
                      <div className="flex items-start gap-4">
                        <img
                          src={user.avatarUrl || "https://placehold.co/64x64"}
                          alt="avatar"
                          className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
                        />
                        <div>
                          <div className="text-lg font-semibold">{user.fullName || "—"}</div>
                          <div className="text-sm text-white/60">{user.email || "—"}</div>
                          <div className="mt-2 text-sm text-white/70">
                            <span className="text-white/60">NIC:</span> {d.nic || "—"}{" "}
                            <span className="text-white/40">•</span>{" "}
                            <span className="text-white/60">Age:</span> {d.age ?? "—"}
                          </div>
                          <div className="text-sm text-white/70">
                            <span className="text-white/60">Address:</span> {d.address || "—"}
                          </div>
                          <div className="text-sm text-white/70">
                            <span className="text-white/60">License #:</span> {d.licenseNumber || "—"}
                          </div>
                        </div>
                      </div>

                      {/* Middle: vehicle */}
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 lg:min-w-[320px]">
                        <div className="text-sm font-semibold">Vehicle</div>
                        <div className="mt-2 text-sm text-white/70">
                          <span className="text-white/60">Type:</span> {vehicle.type || "—"}
                        </div>
                        <div className="text-sm text-white/70">
                          <span className="text-white/60">Number:</span> {vehicle.number || "—"}
                        </div>
                        <div className="text-sm text-white/70">
                          <span className="text-white/60">Color:</span> {vehicle.color || "—"}
                        </div>
                        <div className="text-sm text-white/70">
                          <span className="text-white/60">Seats:</span> {vehicle.seatsTotal ?? "—"}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3">
                          {d.licenseImageUrl && (
                            <a
                              href={d.licenseImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                            >
                              View License Image
                            </a>
                          )}
                          {vehicle.photoUrl && (
                            <a
                              href={vehicle.photoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                            >
                              View Vehicle Photo
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex gap-2 lg:flex-col lg:items-stretch">
                        <button
                          disabled={disabled}
                          onClick={() => approve(d._id)}
                          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-60"
                        >
                          {disabled ? "Working..." : "Approve"}
                        </button>

                        <button
                          disabled={disabled}
                          onClick={() => reject(d._id)}
                          className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/15 disabled:opacity-60"
                        >
                          Reject
                        </button>

                        <div className="mt-2 text-xs text-white/50">
                          Status: <span className="text-white/70">{(d.status || "pending").toUpperCase()}</span>
                        </div>

                        {d.driverId && (
                          <div className="text-xs text-white/50">
                            Driver ID: <span className="text-white/70">{d.driverId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
