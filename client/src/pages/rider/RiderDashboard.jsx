import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Link, useNavigate } from "react-router-dom";

// IMPORT YOUR LOCAL IMAGE HERE
import heroBg from "../../assets/book.png"; 

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
      setErr(""); setMsg(""); setSaving(true);
      const fd = new FormData();
      fd.append("name", name || me?.name || "");
      fd.append("contactNo", contactNo || me?.contactNo || "");
      if (avatar) fd.append("avatar", avatar);
      await api.patch("/api/users/me", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      setEditing(false); setAvatar(null);
      setMsg("Profile updated successfully.");
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.error || "Profile update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    const ok = window.confirm("Are you sure you want to delete your rider account?");
    if (!ok) return;
    try {
      setErr(""); setMsg(""); setDeleting(true);
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-20">
      
      {/* 1. STYLISH VIOLET HERO SECTION */}
      <div className="relative mx-auto max-w-7xl px-4 pt-6">
        <div className="group relative h-80 w-full overflow-hidden rounded-[2.5rem] border border-zinc-800 shadow-[0_20px_50px_rgba(124,58,237,0.15)] md:h-[400px]">
          
          {/* Background Image - High Brightness (0.85 opacity) */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105 opacity-85"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          
          {/* Violet Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-violet-950/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent opacity-50" />

          {/* Hero Content */}
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-violet-400 border border-white/10 mb-6">
                Premium Travel Experience
              </div>
              
              <h1 className="text-5xl font-black tracking-tight text-white md:text-7xl leading-[1.1] drop-shadow-2xl">
                Find <br /> 
                <span className="bg-gradient-to-r from-violet-500 to-fuchsia-400 bg-clip-text text-transparent">
                  Your Ride.
                </span>
              </h1>
              
              <p className="mt-6 text-sm leading-relaxed text-zinc-100 md:text-lg font-medium drop-shadow-lg">
                Choose your exact locations and enjoy a smooth, reliable journey tailored to you from the very beginning.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link 
                  to="/plan" 
                  className="group/btn relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-violet-600 px-10 py-4 font-black text-white transition-all hover:bg-violet-700 hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] active:scale-95"
                >
                  <span>Plan a new trip</span>
                  <span className="transition-transform group-hover/btn:translate-x-1 text-xl">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-7xl gap-8 px-4 lg:grid-cols-12">
        {/* 2. PROFILE SIDEBAR */}
        <aside className="lg:col-span-4">
          <div className="sticky top-6 flex flex-col items-center rounded-[2.5rem] border border-zinc-800 bg-[#121214] p-8 text-center shadow-2xl">
            <div className="relative mb-4">
              {me?.avatarUrl ? (
                <img
                  src={me.avatarUrl}
                  alt={me.name}
                  className="h-32 w-32 rounded-3xl border-4 border-zinc-800 object-cover shadow-2xl"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-zinc-800 bg-zinc-900 text-3xl font-bold text-zinc-500">
                  {initials}
                </div>
              )}
              
            </div>

            <h2 className="mt-4 text-2xl font-medium text-white tracking-tight">{me?.name || "Passenger"}</h2>
            <p className="text-sm text-zinc-500 font-medium">{me?.email || "—"}</p>
            <p className="mt-2 text-xs text-zinc-400 font-semibold tracking-wide">📞 {me?.contactNo || "No contact info"}</p>

            <div className="mt-8 flex w-full flex-col gap-3">
              <button
                onClick={() => {
                  setEditing((v) => !v);
                  setName(me?.name || "");
                  setContactNo(me?.contactNo || "");
                  setAvatar(null);
                  setErr(""); setMsg("");
                }}
                className="w-full rounded-2xl bg-zinc-800/40 py-3.5 text-sm font-bold text-white transition-all hover:bg-green-800 border border-white/5 active:scale-95"
              >
                {editing ? "Cancel Update" : "Update Profile"}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-400 transition-colors"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>

            {editing && (
              <div className="mt-6 w-full space-y-4 border-t border-zinc-800 pt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Full Name</label>
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-violet-600 transition-colors"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Contact Number</label>
                  <input
                    type="text" value={contactNo} onChange={(e) => setContactNo(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-violet-600 transition-colors"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                   <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Avatar Image</label>
                   <input
                    type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                    className="w-full text-[10px] text-zinc-500 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-white file:font-bold"
                  />
                </div>
                <button
                  onClick={handleUpdateProfile} disabled={saving}
                  className="w-full rounded-xl bg-violet-600 py-3.5 text-sm font-black text-white transition-all hover:bg-violet-700 shadow-lg shadow-violet-900/20"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            )}
            {msg && <p className="mt-4 text-xs text-emerald-400 font-bold bg-emerald-500/5 py-2 px-4 rounded-lg border border-emerald-500/10">{msg}</p>}
            {err && <p className="mt-4 text-xs text-red-400 font-bold bg-red-500/5 py-2 px-4 rounded-lg border border-red-500/10">{err}</p>}
          </div>
        </aside>

        {/* 3. MAIN DASHBOARD CONTENT */}
        <main className="lg:col-span-8 space-y-8">
          
          <section className="rounded-[2.5rem] border border-zinc-800 bg-[#121214] p-8 shadow-2xl">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-indigo-400 tracking-tight">Ride Management</h3>
                <p className="text-sm text-white-500 font-medium">Overview of your upcoming and past bookings</p>
              </div>
              <div className="flex gap-1 rounded-2xl bg-zinc-900/50 p-1.5 border border-white/5">
                <label className="rounded-xl bg-red-400 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-xl">Your Bookings</label>
                
              </div>
            </div>

            <div className="space-y-5">
              {bookings.length > 0 ? bookings.map((b) => {
                const route = bookingRoute(b);
                const pickup = bookingPickup(b);
                const canReceipt = b.status === "confirmed" || b.paymentStatus === "paid";
                return (
                  <div key={b._id} className="group relative rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all hover:border-zinc-600 hover:bg-zinc-900/60 shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="text-xl font-bold text-white group-hover:text-violet-400 transition-colors leading-tight">{route}</div>
                        <div className="mt-4 flex flex-wrap gap-6 text-[11px] font-bold text-zinc-400">
                          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950/50 border border-white/5">
                            <span className="text-violet-500 text-sm">📅</span> {pickup}
                          </span>
                          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950/50 border border-white/5">
                            <span className="text-violet-500 text-sm">💺</span> {b.seatsBooked} Seats
                          </span>
                          <span className={`rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border ${b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                            {b.status}
                          </span>
                        </div>
                      </div>
                      <a
                        href={`${apiOrigin}/api/bookings/${b._id}/receipt`}
                        target="_blank" rel="noreferrer"
                        className={`flex items-center justify-center rounded-2xl border border-zinc-700 bg-violet-600 px-8 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all hover:bg-white hover:text-black active:scale-95 shadow-lg ${!canReceipt && "pointer-events-none opacity-20"}`}
                      >
                        E-TICKET
                      </a>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-20 text-center rounded-[2rem] border border-dashed border-zinc-800 bg-zinc-900/10">
                  <div className="text-4xl mb-4 opacity-20">🚗</div>
                  <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">No active bookings found</p>
                </div>
              )}
            </div>
          </section>

          
        </main>
      </div>
    </div>
  );
}