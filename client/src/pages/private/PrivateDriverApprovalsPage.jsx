import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Link } from "react-router-dom";

export default function PrivateDriverApprovalsPage() {
  const [drivers, setDrivers] = useState([]);
  const [msg, setMsg] = useState("");
  const [busyId, setBusyId] = useState("");

  async function load() {
    setMsg("");
    try {
      const { data } = await api.get("/api/admin/drivers/pending");
      setDrivers(data.drivers || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load pending drivers");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id) {
    setBusyId(id);
    setMsg("");
    try {
      const { data } = await api.post(`/api/admin/drivers/${id}/approve`);
      setMsg(`Approved. Driver ID: ${data.driverId}`);
      setDrivers((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setMsg(e?.response?.data?.message || "Approve failed");
    } finally {
      setBusyId("");
    }
  }

  async function reject(id) {
    const note = prompt("Reject reason (optional):") || "";
    setBusyId(id);
    setMsg("");
    try {
      await api.post(`/api/admin/drivers/${id}/reject`, { note });
      setMsg("Rejected.");
      setDrivers((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setMsg(e?.response?.data?.message || "Reject failed");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="grid gap-5">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Driver Approvals</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Review driver registrations and approve/reject. Approval auto-generates Driver ID (D/YYYY/SEQ).
            </p>
          </div>

          <div className="flex gap-2">
            <button className="pill" onClick={load} type="button">
              Refresh
            </button>
            <Link className="pill" to="/private">
              Back
            </Link>
          </div>
        </div>

        {msg ? (
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-200">
            {msg}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3">
        {drivers.map((d) => {
          const reg = d.driverRegistration || {};
          const v = reg.vehicle || {};
          return (
            <div key={d.id} className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/30">
                    {d.avatarUrl ? (
                      <img src={d.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-base font-semibold">{d.name}</div>
                    <div className="text-sm text-zinc-400">{d.email}</div>
                    <div className="mt-2 text-xs text-zinc-400">
                      NIC: <b className="text-zinc-200">{reg.nic || "-"}</b> • License:{" "}
                      <b className="text-zinc-200">{reg.licenseNo || "-"}</b> • Age:{" "}
                      <b className="text-zinc-200">{reg.age || "-"}</b>
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">
                      Vehicle: <b className="text-zinc-200">{v.type || "-"}</b> • No:{" "}
                      <b className="text-zinc-200">{v.number || "-"}</b> • Seats:{" "}
                      <b className="text-zinc-200">{v.seatsTotal || "-"}</b>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {reg.licenseImageUrl ? (
                        <a className="pill" href={reg.licenseImageUrl} target="_blank" rel="noreferrer">
                          View License Image
                        </a>
                      ) : null}
                      {v.photoUrl ? (
                        <a className="pill" href={v.photoUrl} target="_blank" rel="noreferrer">
                          View Vehicle Photo
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="pill pill-active"
                    disabled={busyId === d.id}
                    onClick={() => approve(d.id)}
                    type="button"
                  >
                    {busyId === d.id ? "Working..." : "Approve"}
                  </button>
                  <button
                    className="pill"
                    disabled={busyId === d.id}
                    onClick={() => reject(d.id)}
                    type="button"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {!drivers.length ? (
          <div className="card p-6 text-sm text-zinc-400">No pending driver registrations.</div>
        ) : null}
      </div>
    </div>
  );
}
