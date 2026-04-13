import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import { resolveMediaUrl } from "../../lib/mediaUrl";

// 1. Import your image from the assets folder
import planRideBg from "../../assets/driver.png"; 

// --- UI HELPER COMPONENTS ---

function statusBadge(status) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider border transition-all";
  if (status === "approved")
    return `${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-400`;
  if (status === "pending")
    return `${base} border-amber-500/30 bg-amber-500/10 text-amber-400`;
  if (status === "rejected")
    return `${base} border-red-500/30 bg-red-500/10 text-red-400`;
  return `${base} border-zinc-700 bg-zinc-800 text-zinc-400`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function bookingTone(status) {
  const base = "inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight";
  if (status === "confirmed") return `${base} border-emerald-500/20 bg-emerald-500/5 text-emerald-400`;
  if (status === "pending") return `${base} border-amber-500/20 bg-amber-500/5 text-amber-400`;
  if (status === "rejected") return `${base} border-red-500/20 bg-red-500/5 text-red-400`;
  return `${base} border-zinc-800 bg-zinc-900 text-zinc-500`;
}

function paymentTone(status) {
  const base = "inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight";
  // Changed sky-400/500 to red-400/500
  if (status === "paid") return `${base} border-red-500/20 bg-red-500/5 text-red-400`;
  if (status === "failed") return `${base} border-red-500/20 bg-red-500/5 text-red-400`;
  return `${base} border-zinc-800 bg-zinc-900 text-zinc-500`;
}

function canMarkPassengerRideCompleted(booking) {
  return booking?.status === "confirmed" && booking?.paymentStatus === "paid" && !booking?.rideCompleted;
}

function PassengerCard({ booking, onComplete, marking }) {
  const rider = booking?.riderId && typeof booking.riderId === "object" ? booking.riderId : null;
  const riderName = rider?.name || "Passenger";
  const riderInitial = riderName?.trim()?.charAt(0)?.toUpperCase() || "P";
  const rideDone = Boolean(booking?.rideCompleted);

  return (
    <div className="group rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900/60 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border-2 border-zinc-800 bg-zinc-950 shadow-inner">
            {rider?.avatarUrl ? (
              <img src={resolveMediaUrl(rider.avatarUrl)} alt={riderName} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-lg font-bold text-zinc-600">
                {riderInitial}
              </div>
            )}
          </div>
          <div>
            <div className="text-base font-bold text-white tracking-tight">{riderName}</div>
            <div className="text-xs text-zinc-500 font-medium">{rider?.email || "—"}</div>
            <div className="mt-1 text-xs text-zinc-400 flex items-center gap-1.5">
              <span className="opacity-50">Contact:</span> {rider?.contactNo || "Not added"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={bookingTone(booking?.status)}>{booking?.status || "unknown"}</span>
          <span className={paymentTone(booking?.paymentStatus)}>{booking?.paymentStatus || "unknown"}</span>
          {rideDone && (
            <span className="inline-flex items-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
              Completed
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Seats", val: booking?.seatsBooked || 0 },
          { label: "Amount", val: `LKR ${Number(booking?.amount || 0).toLocaleString()}` },
          { label: "Booked At", val: formatDateTime(booking?.createdAt) },
          { label: "Ride Status", val: rideDone ? "Completed" : "Active" }
        ].map((stat, i) => (
          <div key={i} className="rounded-xl bg-black/40 p-3 border border-zinc-800/30">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{stat.label}</div>
            <div className="mt-1 text-sm font-semibold text-zinc-200">{stat.val}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-zinc-800/50 pt-4">
        <div className="text-xs font-medium text-zinc-500">
          Dist: <span className="text-zinc-300">{booking?.routeDistanceText || "—"}</span>
        </div>

        {canMarkPassengerRideCompleted(booking) ? (
          <button
            type="button"
            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-black transition-all hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
            onClick={() => onComplete(booking)}
            disabled={marking}
          >
            {marking ? "Processing..." : "Finish Drop-off"}
          </button>
        ) : (
          <div className={`text-[11px] font-bold uppercase ${rideDone ? 'text-emerald-500/70' : 'text-zinc-600'}`}>
            {rideDone ? "✓ Completed" : "Payment Required"}
          </div>
        )}
      </div>
    </div>
  );
}

// --- MAIN DASHBOARD ---

export default function DriverDashboard() {
  const qc = useQueryClient();
  const [offersView, setOffersView] = useState("upcoming");
  
  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/api/auth/me")).data,
    staleTime: 0,
  });

  const regQ = useQuery({
    queryKey: ["driver-registration-me"],
    queryFn: async () => (await api.get("/api/driver-registration/me")).data,
    staleTime: 0,
  });

  const offersQ = useQuery({
    queryKey: ["my-offers", offersView],
    queryFn: async () => (await api.get("/api/offers/my", { params: { view: offersView } })).data,
  });

  const user = meQ.data?.user;
  const reg = regQ.data?.driverRegistration || user?.driverRegistration;
  const status = reg?.status || "not_submitted";
  const isApproved = status === "approved";
  const vehicle = reg?.vehicle || null;

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [offersMsg, setOffersMsg] = useState("");
  const [openPassengersByOfferId, setOpenPassengersByOfferId] = useState({});
  const [offerPassengersMap, setOfferPassengersMap] = useState({});
  const [passengersLoadingByOfferId, setPassengersLoadingByOfferId] = useState({});
  const [passengersErrorByOfferId, setPassengersErrorByOfferId] = useState({});
  const [passengerCompletingId, setPassengerCompletingId] = useState(null);
  const [showLicense, setShowLicense] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
    setContactNo(user?.contactNo || "");
  }, [user?.name, user?.contactNo]);

  // HANDLERS
  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true); setMsg("");
    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append("name", name); fd.append("contactNo", contactNo); fd.append("avatar", avatarFile);
        await api.patch("/api/users/me", fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.patch("/api/users/me", { name, contactNo });
      }
      setEditing(false); setAvatarFile(null);
      await qc.invalidateQueries({ queryKey: ["me"] });
      setMsg("Profile updated ✅");
    } catch (err) { setMsg("Profile update failed"); }
    finally { setSaving(false); }
  }

  async function deleteOfferById(id) {
    if (!id || !window.confirm("Delete this offer?")) return;
    setOffersMsg(""); setDeletingId(id);
    try {
      await api.delete(`/api/offers/${id}`);
      await qc.invalidateQueries({ queryKey: ["my-offers"] });
      setOffersMsg("Offer deleted ✅");
    } catch (e) { setOffersMsg("Delete failed"); }
    finally { setDeletingId(null); }
  }

  async function markCompleted(id) {
    if (!id || !window.confirm("Mark trip as completed?")) return;
    setOffersMsg(""); setCompletingId(id);
    try {
      await api.patch(`/api/offers/${id}`, { status: "completed" });
      await qc.invalidateQueries({ queryKey: ["my-offers"] });
      setOffersMsg("Ride completed ✅");
    } catch (e) { setOffersMsg("Failed to mark completed"); }
    finally { setCompletingId(null); }
  }

  async function togglePassengers(offerId) {
    if (!offerId) return;
    const willOpen = !openPassengersByOfferId[offerId];
    setOpenPassengersByOfferId((prev) => ({ ...prev, [offerId]: willOpen }));
    if (!willOpen || offerPassengersMap[offerId]) return;
    setPassengersErrorByOfferId((prev) => ({ ...prev, [offerId]: "" }));
    setPassengersLoadingByOfferId((prev) => ({ ...prev, [offerId]: true }));
    try {
      const { data } = await api.get(`/api/bookings/offers/${offerId}`);
      setOfferPassengersMap((prev) => ({ ...prev, [offerId]: Array.isArray(data?.bookings) ? data.bookings : [] }));
    } catch (e) { setPassengersErrorByOfferId((prev) => ({ ...prev, [offerId]: "Failed to load" })); }
    finally { setPassengersLoadingByOfferId((prev) => ({ ...prev, [offerId]: false })); }
  }

  async function markPassengerCompleted(booking) {
    if (!booking?._id || !window.confirm(`Complete ride for passenger?`)) return;
    setOffersMsg(""); setPassengerCompletingId(booking._id);
    try {
      const { data } = await api.patch(`/api/bookings/${booking._id}/complete-ride`);
      setOfferPassengersMap((prev) => ({
        ...prev,
        [booking.offerId]: prev[booking.offerId].map((item) => item._id === booking._id ? { ...item, ...data.booking } : item),
      }));
      setOffersMsg("Passenger ride completed ✅");
    } catch (e) { setOffersMsg("Failed to mark completed"); }
    finally { setPassengerCompletingId(null); }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      
      {/* --- PLAN A RIDE HEADER --- */}
      <div 
        className="relative overflow-hidden rounded-[2.5rem] py-28 px-8 border border-white/5 bg-cover bg-center shadow-2xl transition-transform duration-1000 hover:scale-105 opacity-85"
        style={{ backgroundImage: `url(${planRideBg})` }} 
      >
        <div className="" />
        
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white lg:text-5xl">
              Plan <span className="text-[#ff0000]">Your Ride.</span>
            </h1>
            <p className="mt-2 text-zinc-300 font-medium max-w-md">
              Ready to hit the road? Set your destination and pick up passengers along your route.
            </p>
          </div>
          
          <div className="flex gap-3">
            {isApproved ? (
              // Changed shadow and bg to red
              <Link to="/driver/offer" className="group flex items-center gap-2 rounded-2xl bg-[#ff0000] px-8 py-4 text-sm font-bold text-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-red-500/20">
                <span>Offer New Ride</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-black/60 backdrop-blur-md px-6 py-4 border border-white/10">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Verification Required</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PROFILE & VEHICLE */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-[2rem] bg-zinc-900/50 border border-zinc-800/50 p-6 backdrop-blur-sm shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="h-24 w-24 overflow-hidden rounded-[2rem] border-4 border-zinc-800 shadow-2xl">
                  {user?.avatarUrl ? (
                    <img src={resolveMediaUrl(user.avatarUrl)} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-zinc-800 text-2xl font-bold text-zinc-500">{user?.name?.charAt(0)}</div>
                  )}
                </div>
                <div className="">
                    <span className={statusBadge(status)}>{status === 'approved' ? 'Verified' : status}</span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{user?.name || "Driver"}</h2>
              <p className="text-sm text-zinc-500">{user?.email}</p>
              
              <div className="mt-6 flex w-full gap-2">
                <button onClick={() => setEditing(!editing)} className="flex-1 rounded-xl bg-zinc-800 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition-colors">
                  {editing ? "Cancel" : "Update Profile"}
                </button>
                <Link to="/driver/register" className="flex-1 rounded-xl bg-white/5 border border-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors text-center">
                  Settings
                </Link>
              </div>
            </div>

            {editing && (
               <form onSubmit={saveProfile} className="mt-6 space-y-4 border-t border-zinc-800 pt-6">
                 <input className="w-full rounded-xl bg-black/50 border border-zinc-700 px-4 py-3 text-sm text-white outline-none" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
                 <input className="w-full rounded-xl bg-black/50 border border-zinc-700 px-4 py-3 text-sm text-white outline-none" value={contactNo} onChange={(e) => setContactNo(e.target.value)} placeholder="Contact Number" />
                 <input type="file" className="text-xs text-zinc-500" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                 {/* Changed bg color to red */}
                 <button className="w-full rounded-xl bg-[#ff0000] py-3 text-sm font-bold text-black" disabled={saving}>{saving ? "Updating..." : "Save Changes"}</button>
               </form>
            )}
            {msg && <p className="mt-4 text-center text-xs font-medium text-emerald-400">{msg}</p>}
          </div>

          {/* VEHICLE & LICENSE DETAILS */}
          <div className="rounded-[2rem] bg-zinc-900/50 border border-zinc-800/50 p-6 shadow-xl">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">My Vehicle</h3>
            {vehicle ? (
              <div className="space-y-4">
                <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black/40">
                  {vehicle.photoUrl ? (
                    <img src={resolveMediaUrl(vehicle.photoUrl)} alt="Vehicle" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest">No Vehicle Photo</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-black/30 p-4 border border-zinc-800/50">
                    <span className="text-xs text-zinc-500 font-medium">Number</span>
                    <span className="text-sm font-bold text-white tracking-wider">{vehicle.number}</span>
                  </div>
                  
                  <div className="rounded-xl bg-black/30 p-4 border border-zinc-800/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">Driving License</span>
                      {reg?.licenseImageUrl ? (
                        // Changed text color to red
                        <button onClick={() => setShowLicense(!showLicense)} className="text-xs font-bold text-[#ff0000] hover:text-white uppercase tracking-tight">
                          {showLicense ? "Hide Image" : "View Image"}
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-700 font-bold uppercase tracking-tight">Not Available</span>
                      )}
                    </div>
                    {showLicense && reg?.licenseImageUrl && (
                      <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                         <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                            <img src={resolveMediaUrl(reg.licenseImageUrl)} alt="License" className="h-full w-full object-contain" />
                         </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-black/30 p-3 border border-zinc-800/50 text-center">
                       <p className="text-[10px] text-zinc-600 uppercase font-bold">Seats</p>
                       <p className="text-sm font-bold text-zinc-300">{vehicle.seatsTotal}</p>
                    </div>
                    <div className="rounded-xl bg-black/30 p-3 border border-zinc-800/50 text-center">
                       <p className="text-[10px] text-zinc-600 uppercase font-bold">Type</p>
                       <p className="text-sm font-bold text-zinc-300 line-clamp-1">{vehicle.type}</p>
                    </div>
                  </div>
                </div>
                {/* Changed text color to red */}
                <Link to="/driver/register" className="block text-center text-xs font-bold text-[#ff0000] hover:underline uppercase tracking-widest pt-2">
                  Update All Info
                </Link>
              </div>
            ) : (
              <div className="py-10 text-center">
                 <p className="text-xs text-zinc-500 italic">No vehicle data.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RIDE OFFERS */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-white">Ride Management</h2>
            <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
              {["upcoming", "past", "all"].map((t) => (
                <button
                  key={t}
                  onClick={() => { setOffersMsg(""); setOffersView(t); }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    offersView === t ? "bg-zinc-700 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {offersQ.isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1,2].map(i => <div key={i} className="h-40 bg-zinc-900/50 rounded-[2rem]" />)}
              </div>
            ) : offersQ.data?.offers?.length > 0 ? (
              offersQ.data.offers.map((o) => {
                const isPast = o?.pickupTime ? new Date(o.pickupTime).getTime() < Date.now() : false;
                const isCompleted = o?.status === "completed";
                const passengers = offerPassengersMap[o._id] || [];
                const isPassengersOpen = !!openPassengersByOfferId[o._id];

                return (
                  <div key={o._id} className="rounded-[2rem] bg-zinc-900/30 border border-zinc-800/50 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                           <span className="text-lg font-bold text-white">{o?.seatsAvailable} Seats</span>
                           {/* Changed text color to red */}
                           <span className="text-xs font-bold uppercase tracking-widest text-[#ff0000]">{o?.status}</span>
                        </div>
                        <div className="mt-3 space-y-1">
                             <p className="text-sm text-zinc-400 line-clamp-1">From: {o?.origin?.address}</p>
                             <p className="text-sm font-bold text-zinc-200 line-clamp-1">To: {o?.destination?.address}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/driver/offers/${o._id}/edit`} className="rounded-xl bg-zinc-800 p-3 hover:bg-zinc-700">
                           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </Link>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-6">
                         {/* Changed text color to red */}
                         <button onClick={() => togglePassengers(o._id)} className="text-xs font-bold text-[#ff0000] uppercase">
                            {isPassengersOpen ? "Hide Bookings" : `Bookings (${passengers.length})`}
                         </button>
                      {isPast && !isCompleted && (
                        <button onClick={() => markCompleted(o._id)} className="rounded-xl bg-emerald-500 px-6 py-2 text-xs font-bold text-black">
                          End Trip
                        </button>
                      )}
                    </div>

                    {isPassengersOpen && (
                       <div className="mt-6 space-y-4 animate-in slide-in-from-top-2">
                          {passengersLoadingByOfferId[o._id] ? (
                             <div className="text-center py-4 text-xs text-zinc-600 animate-pulse">Loading...</div>
                          ) : (
                            <div className="grid gap-4">
                               {passengers.map(b => <PassengerCard key={b._id} booking={b} onComplete={markPassengerCompleted} marking={passengerCompletingId === b._id} />)}
                            </div>
                          )}
                       </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center rounded-[2rem] bg-zinc-900/10 border border-zinc-800 border-dashed">
                <p className="text-xs font-bold text-zinc-600 uppercase">No rides to show</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}