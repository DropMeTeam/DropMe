import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Link, useNavigate } from "react-router-dom";

export default function RiderDashboard() {
  const queryClient = useQueryClient();
  const nav = useNavigate();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/api/users/me")).data,
  });

  const { data } = useQuery({
    queryKey: ["my-requests"],
    queryFn: async () => (await api.get("/api/requests/my")).data,
  });

  const { data: bData } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: async () => (await api.get("/api/bookings/my")).data,
  });

  const me = meData?.user || {};
  const requests = data?.requests || [];
  const bookings = bData?.bookings || [];

  const apiOrigin = useMemo(() => {
    const base = api?.defaults?.baseURL;
    if (typeof base === "string" && base.startsWith("http")) {
      return base.replace(/\/$/, "");
    }
    return import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";
  }, []);

  const initials = useMemo(() => {
    const raw = String(me?.name || "Rider").trim();
    if (!raw) return "R";
    return raw
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("");
  }, [me?.name]);

  function bookingRoute(b) {
    const offer = b.offerId;
    if (offer?.origin?.address || offer?.destination?.address) {
      return `${offer.origin?.address || "Origin"} → ${offer.destination?.address || "Destination"}`;
    }
    const s = b.offerSnapshot || {};
    return `${s.originAddress || "Origin"} → ${s.destinationAddress || "Destination"}`;
  }

  function bookingPickup(b) {
    const offer = b.offerId;
    if (offer?.pickupTime) return new Date(offer.pickupTime).toLocaleString();
    const s = b.offerSnapshot || {};
    if (s.pickupTime) return new Date(s.pickupTime).toLocaleString();
    return "—";
  }

  async function handleUpdateProfile() {
    try {
      setErr("");
      setMsg("");
      setSaving(true);

      const fd = new FormData();
      fd.append("name", name || me?.name || "");
      fd.append("contactNo", contactNo || me?.contactNo || "");
      if (avatar) fd.append("avatar", avatar);

      await api.patch("/api/users/me", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await queryClient.invalidateQueries({ queryKey: ["me"] });
      setEditing(false);
      setAvatar(null);
      setMsg("Profile updated successfully.");
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.error || "Profile update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    const ok = window.confirm(
      "Are you sure you want to delete your rider account? This action cannot be undone."
    );
    if (!ok) return;

    try {
      setErr("");
      setMsg("");
      setDeleting(true);

      await api.delete("/api/users/me");
      await api.post("/api/auth/logout").catch(() => {});

      queryClient.clear();
      nav("/register", { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.error || "Delete account failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            {me?.avatarUrl ? (
              <img
                src={me.avatarUrl}
                alt={me.name || "Rider"}
                className="h-16 w-16 rounded-2xl border border-zinc-800 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/40 text-lg font-semibold">
                {initials}
              </div>
            )}

            <div>
              <div className="text-2xl font-semibold">{me?.name || "Rider"}</div>
              <div className="mt-1 text-sm text-zinc-400">{me?.email || "—"}</div>
              <div className="mt-1 text-sm text-zinc-400">
                Contact No: {me?.contactNo || "Not added"}
              </div>
              <div className="mt-2 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Account: {me?.role || "rider"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setEditing((v) => !v);
                setName(me?.name || "");
                setContactNo(me?.contactNo || "");
                setAvatar(null);
                setErr("");
                setMsg("");
              }}
              className="btn btn-primary"
            >
              {editing ? "Cancel Update" : "Update Profile"}
            </button>

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="btn border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15 disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>

        {msg ? <div className="mt-4 text-sm text-emerald-300">{msg}</div> : null}
        {err ? <div className="mt-4 text-sm text-red-300">{err}</div> : null}

        {editing ? (
          <div className="mt-6 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 outline-none focus:border-zinc-600"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">Contact Number</label>
              <input
                type="text"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 outline-none focus:border-zinc-600"
                placeholder="Enter contact number"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-zinc-400">Profile Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-black"
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="button"
                onClick={handleUpdateProfile}
                disabled={saving}
                className="btn btn-primary disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="card p-6">
        <div className="text-xl font-semibold">Rider dashboard</div>
        <div className="mt-1 text-sm text-zinc-400">
          Your ride requests, profile details, and bookings.
        </div>

        <div className="mt-4 flex gap-3">
          <Link to="/plan" className="btn-primary btn">
            Plan a new trip
          </Link>
        </div>
      </div>

      <div className="card p-6">
        <div className="text-sm font-semibold">Requests</div>
        <div className="mt-3 grid gap-2">
          {requests.map((r) => (
            <div
              key={r._id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4"
            >
              <div className="text-sm font-medium">{r.mode}</div>
              <div className="mt-1 text-xs text-zinc-400">
                {r.origin?.address || "Origin"} → {r.destination?.address || "Destination"}
              </div>
              <div className="mt-1 text-xs text-zinc-400">Status: {r.status}</div>
            </div>
          ))}
          {!requests.length ? (
            <div className="text-sm text-zinc-400">No requests yet.</div>
          ) : null}
        </div>
      </div>

      <div className="card p-6">
        <div className="text-sm font-semibold">My bookings</div>
        <div className="mt-3 grid gap-2">
          {bookings.map((b) => {
            const route = bookingRoute(b);
            const pickup = bookingPickup(b);
            const canReceipt = b.status === "confirmed" || b.paymentStatus === "paid";

            return (
              <div
                key={b._id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{route}</div>
                    <div className="mt-1 text-xs text-zinc-400">Pickup: {pickup}</div>
                    <div className="mt-1 text-xs text-zinc-400">
                      Seats: {b.seatsBooked} • Status: {b.status}
                      {b.paymentStatus ? ` • Payment: ${b.paymentStatus}` : ""}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <a
                      className={`btn border ${canReceipt ? "" : "opacity-40 pointer-events-none"}`}
                      href={`${apiOrigin}/api/bookings/${b._id}/receipt`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Receipt
                    </a>
                  </div>
                </div>
              </div>
            );
          })}

          {!bookings.length ? (
            <div className="text-sm text-zinc-400">No bookings yet.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}