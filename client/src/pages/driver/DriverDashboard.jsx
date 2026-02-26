import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../lib/api";

function statusBadge(status) {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border";
  if (status === "approved")
    return `${base} border-emerald-400/40 bg-emerald-500/10 text-emerald-200`;
  if (status === "pending")
    return `${base} border-yellow-400/40 bg-yellow-500/10 text-yellow-200`;
  if (status === "rejected")
    return `${base} border-red-400/40 bg-red-500/10 text-red-200`;
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../lib/api"; // <-- if your api is named export, use: import { api } from "../../lib/api";

function statusBadge(status) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border";
  if (status === "approved") return `${base} border-emerald-400/40 bg-emerald-500/10 text-emerald-200`;
  if (status === "pending") return `${base} border-yellow-400/40 bg-yellow-500/10 text-yellow-200`;
  if (status === "rejected") return `${base} border-red-400/40 bg-red-500/10 text-red-200`;
  return `${base} border-zinc-700 bg-zinc-950/30 text-zinc-300`;
}

function pretty(v) {
  return v ? String(v) : "—";
}

export default function DriverDashboard() {
  const qc = useQueryClient();

  // ✅ get full user profile (name/email/avatar/role + driverRegistration in DB)
  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/api/auth/me")).data,
    staleTime: 0,
  });

  // ✅ get driver registration record (pending/approved + details)
  const regQ = useQuery({
    queryKey: ["driver-registration-me"],
    queryFn: async () => (await api.get("/api/driver-registration/me")).data,
    staleTime: 0,
  });

  // ✅ offers filter
  const [offersView, setOffersView] = useState("upcoming"); // upcoming | past | all

  const offersQ = useQuery({
    queryKey: ["my-offers", offersView],
    queryFn: async () =>
      (
        await api.get("/api/offers/my", {
          params: { view: offersView },
        })
      ).data,
  });

  const user = meQ.data?.user;
  const reg = regQ.data?.driverRegistration || user?.driverRegistration;
  // existing offers
  const offersQ = useQuery({
    queryKey: ["my-offers"],
    queryFn: async () => (await api.get("/api/offers/my")).data,
  });

  const user = meQ.data?.user;
  const reg = regQ.data?.driverRegistration || user?.driverRegistration; // fallback if you return it in /me
  const status = reg?.status || "not_submitted";
  const isApproved = status === "approved";

  // ===== Profile edit state =====
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // ✅ offer actions
  const [deletingId, setDeletingId] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [offersMsg, setOffersMsg] = useState("");

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");

    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append("name", name);
        fd.append("avatar", avatarFile);

        await api.patch("/api/users/me", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.patch("/api/users/me", { name });
      }

      setEditing(false);
      setAvatarFile(null);

      await qc.invalidateQueries({ queryKey: ["me"] });
      setMsg("Profile updated ✅");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Profile update failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteOfferById(id) {
    if (!id) return;

    const ok = window.confirm("Delete this offer? This action cannot be undone.");
    if (!ok) return;

    setOffersMsg("");
    setDeletingId(id);

    try {
      await api.delete(`/api/offers/${id}`);
      await qc.invalidateQueries({ queryKey: ["my-offers"] });
      setOffersMsg("Offer deleted ✅");
    } catch (e) {
      setOffersMsg(e?.response?.data?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function markCompleted(id) {
    if (!id) return;

    const ok = window.confirm("Mark this ride as COMPLETED?");
    if (!ok) return;

    setOffersMsg("");
    setCompletingId(id);

    try {
      // ✅ uses your updateOffer endpoint
      await api.patch(`/api/offers/${id}`, { status: "completed" });
      await qc.invalidateQueries({ queryKey: ["my-offers"] });
      setOffersMsg("Ride marked as completed ✅");
    } catch (e) {
      setOffersMsg(e?.response?.data?.message || "Failed to mark completed");
    } finally {
      setCompletingId(null);
    }
  }

  const vehicle = reg?.vehicle || null;

  const registerCtaText =
    status === "not_submitted"
      ? "Driver Registration"
      : status === "rejected"
      ? "Resubmit Registration"
      : "Update Submission";

  return (
    <div className="grid gap-6">
      {/* ✅ PROFILE CARD */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-xs text-zinc-400">
                  No photo
                </div>
                <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-xs text-zinc-400">No photo</div>
              )}
            </div>

            <div>
              <div className="text-lg font-semibold">{user?.name || "Driver"}</div>
              <div className="text-sm text-zinc-400">{user?.email || "—"}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={statusBadge(status)}>
                  Registration: {status}
                  {reg?.driverId ? ` • ${reg.driverId}` : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Close" : "Update Profile"}
            </button>

            <Link to="/driver/register" className="btn btn-primary">
              {registerCtaText}
            </Link>

            {isApproved ? (
              <Link to="/driver/offer" className="btn btn-primary">
                Add Ride
              </Link>
            ) : (
              <button
                className="btn btn-outline"
                type="button"
                disabled
                title="Approve registration to add rides"
              >
                Add Ride (Locked)
              </button>
            )}
            <button className="btn btn-outline" type="button" onClick={() => setEditing((v) => !v)}>
              {editing ? "Close" : "Update Profile"}
            </button>

            {/* ✅ Register / Resubmit / Update */}
            <Link to="/driver/register" className="btn btn-primary">
              {registerCtaText}
            </Link>

            {/* ✅ Add Ride gated */}
            {isApproved ? (
              <Link to="/driver/offer" className="btn btn-primary">
                Add Ride
              </Link>
            ) : (
              <button className="btn btn-outline" type="button" disabled title="Approve registration to add rides">
                Add Ride (Locked)
              </button>
            )}
          </div>
        </div>

        {msg ? <div className="mt-3 text-sm text-zinc-300">{msg}</div> : null}

        {editing ? (
          <form onSubmit={saveProfile} className="mt-5 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <div className="grid gap-1">
              <label className="text-xs text-zinc-400">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid gap-1">
              <label className="text-xs text-zinc-400">Profile image</label>
              <input className="input" type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
            </div>

            <div className="flex gap-3">
              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={saving}
                onClick={() => {
                  setEditing(false);
                  setAvatarFile(null);
                  setName(user?.name || "");
                  setMsg("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {/* ✅ DRIVER REGISTRATION DETAILS CARD */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Driver Registration Details</div>
            <div className="mt-1 text-xs text-zinc-400">
              This section shows NIC, license, and vehicle details you submitted.
            </div>
          </div>

          <Link to="/driver/register" className="btn btn-outline">
            {registerCtaText}
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <div className="text-xs text-zinc-400">NIC</div>
            <div className="text-sm font-semibold">{pretty(reg?.nic)}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <div className="text-xs text-zinc-400">License No</div>
            <div className="text-sm font-semibold">{pretty(reg?.licenseNo)}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 md:col-span-2">
            <div className="text-xs text-zinc-400">Address</div>
            <div className="text-sm font-semibold">{pretty(reg?.address)}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <div className="text-xs text-zinc-400">Age</div>
            <div className="text-sm font-semibold">{pretty(reg?.age)}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <div className="text-xs text-zinc-400">Submitted At</div>
            <div className="text-sm font-semibold">
              {reg?.submittedAt ? new Date(reg.submittedAt).toLocaleString() : "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 md:col-span-2">
            <div className="text-xs text-zinc-400">Vehicle</div>
            <div className="text-sm font-semibold">
              {vehicle
                ? `${vehicle.type} • ${vehicle.number} • ${vehicle.color} • Seats: ${vehicle.seatsTotal}`
                : "—"}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {reg?.licenseImageUrl ? (
                <a className="btn btn-outline" href={reg.licenseImageUrl} target="_blank" rel="noreferrer">
                  View License Image
                </a>
              ) : null}
              {vehicle?.photoUrl ? (
                <a className="btn btn-outline" href={vehicle.photoUrl} target="_blank" rel="noreferrer">
                  View Vehicle Photo
                </a>
              ) : null}
            </div>

            {status === "rejected" && reg?.reviewNote ? (
              <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                Rejected reason: {reg.reviewNote}
              </div>
            ) : null}
          </div>
        </div>

        {msg ? <div className="mt-3 text-sm text-zinc-300">{msg}</div> : null}

        {editing ? (
          <form
            onSubmit={saveProfile}
            className="mt-5 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4"
          >
            <div className="grid gap-1">
              <label className="text-xs text-zinc-400">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid gap-1">
              <label className="text-xs text-zinc-400">Profile image</label>
              <input
                className="input"
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="flex gap-3">
              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={saving}
                onClick={() => {
                  setEditing(false);
                  setAvatarFile(null);
                  setName(user?.name || "");
                  setMsg("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {/* ✅ DRIVER REGISTRATION DETAILS CARD */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Driver Registration Details</div>
            <div className="mt-1 text-xs text-zinc-400">
              This section shows NIC, license, and vehicle details you submitted.
      {/* Offers (unchanged) */}
      <div className="card p-6">
        <div className="text-sm font-semibold">Offers</div>
        <div className="mt-3 grid gap-2">
          {(offersQ.data?.offers || []).map((o) => (
            <div key={o._id} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
              <div className="text-sm font-medium">
                Seats: {o.seatsAvailable}/{o.seatsTotal} • {o.status}
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                {o.origin?.address || "Origin"} → {o.destination?.address || "Destination"}
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                Pickup: {o.pickupTime ? new Date(o.pickupTime).toLocaleString() : "—"}
              </div>
            </div>
          </div>

          <Link to="/driver/register" className="btn btn-outline">
            {registerCtaText}
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <div className="text-xs text-zinc-400">NIC</div>
            <div className="text-sm font-semibold">{pretty(reg?.nic)}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <div className="text-xs text-zinc-400">License No</div>
            <div className="text-sm font-semibold">{pretty(reg?.licenseNo)}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 md:col-span-2">
            <div className="text-xs text-zinc-400">Address</div>
            <div className="text-sm font-semibold">{pretty(reg?.address)}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <div className="text-xs text-zinc-400">Age</div>
            <div className="text-sm font-semibold">{pretty(reg?.age)}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <div className="text-xs text-zinc-400">Submitted At</div>
            <div className="text-sm font-semibold">
              {reg?.submittedAt ? new Date(reg.submittedAt).toLocaleString() : "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 md:col-span-2">
            <div className="text-xs text-zinc-400">Vehicle</div>
            <div className="text-sm font-semibold">
              {vehicle
                ? `${vehicle.type} • ${vehicle.number} • ${vehicle.color} • Seats: ${vehicle.seatsTotal}`
                : "—"}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {reg?.licenseImageUrl ? (
                <a className="btn btn-outline" href={reg.licenseImageUrl} target="_blank" rel="noreferrer">
                  View License Image
                </a>
              ) : null}
              {vehicle?.photoUrl ? (
                <a className="btn btn-outline" href={vehicle.photoUrl} target="_blank" rel="noreferrer">
                  View Vehicle Photo
                </a>
              ) : null}
            </div>

            {status === "rejected" && reg?.reviewNote ? (
              <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                Rejected reason: {reg.reviewNote}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ✅ OFFERS */}
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">Offers</div>
          <div className="text-xs text-zinc-400">
            {offersQ.isLoading ? "Loading..." : `${offersQ.data?.offers?.length || 0} offers`}
          </div>
        </div>

        {/* tabs */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { id: "upcoming", label: "Upcoming" },
            { id: "past", label: "Past" },
            { id: "all", label: "All" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setOffersMsg("");
                setOffersView(t.id);
              }}
              className={
                "rounded-xl border px-3 py-2 text-xs font-semibold " +
                (offersView === t.id
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {offersMsg ? <div className="mt-3 text-sm text-zinc-300">{offersMsg}</div> : null}

        {offersQ.isError ? (
          <div className="mt-3 text-sm text-red-300">
            {offersQ.error?.response?.data?.message || "Failed to load offers"}
          </div>
        ) : null}

        <div className="mt-3 grid gap-2">
          {offersQ.isLoading ? (
            <div className="text-sm text-zinc-400">Loading offers...</div>
          ) : (
            (offersQ.data?.offers || []).map((o) => {
              const isPast = o?.pickupTime ? new Date(o.pickupTime).getTime() < Date.now() : false;
              const isCompleted = o?.status === "completed";

              const showCompletionUI = offersView === "past" || (offersView === "all" && isPast);

              return (
                <div key={o._id} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">
                        Seats: {o?.seatsAvailable}/{o?.seatsTotal} • {o?.status}

                        {showCompletionUI ? (
                          isCompleted ? (
                            <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border border-emerald-400/40 bg-emerald-500/10 text-emerald-200">
                              Completed
                            </span>
                          ) : (
                            <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border border-yellow-400/40 bg-yellow-500/10 text-yellow-200">
                              Not completed
                            </span>
                          )
                        ) : null}
                      </div>

                      <div className="mt-1 text-xs text-zinc-400">
                        {o?.origin?.address || "Origin"} → {o?.destination?.address || "Destination"}
                      </div>
                      <div className="mt-1 text-xs text-zinc-400">
                        Pickup: {o?.pickupTime ? new Date(o.pickupTime).toLocaleString() : "—"}
                      </div>

                      {/* ✅ Past view: show "Mark Completed" button if not completed */}
                      {showCompletionUI && !isCompleted ? (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => markCompleted(o._id)}
                            disabled={completingId === o._id}
                            className="btn btn-outline border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15 disabled:opacity-60"
                          >
                            {completingId === o._id ? "Marking..." : "Mark Completed"}
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {/* actions */}
                    <div className="flex flex-col gap-2 min-w-[110px]">
                      <Link
                        to={`/driver/offers/${o._id}/edit`}
                        className="btn btn-outline border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        className="btn btn-outline border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/15 disabled:opacity-60"
                        disabled={deletingId === o._id}
                        onClick={() => deleteOfferById(o._id)}
                        title={deletingId === o._id ? "Deleting..." : "Delete this offer"}
                      >
                        {deletingId === o._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {!offersQ.isLoading && !offersQ.data?.offers?.length ? (
            <div className="text-sm text-zinc-400">No offers found for this filter.</div>
          ) : null}
          {!offersQ.data?.offers?.length ? <div className="text-sm text-zinc-400">No offers yet.</div> : null}
        </div>
      </div>
    </div>
  );
}