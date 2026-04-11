import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  Calendar, 
  Star, 
  Trophy, 
  LogOut, 
  ChevronRight,
  MapPin,
  TrendingUp,
  Settings,
  ShieldCheck,
  CreditCard
} from "lucide-react";
import RiderReviewsPage from "./RiderReviewsPage";
import RiderLeaderboardPage from "./RiderLeaderboardPage";

// MAIN Background
import heroBg from "../../assets/travel.png"; 
// BOOKINGS Background
import bookingsBg from "../../assets/book.png"; 

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
  const [activeTab, setActiveTab] = useState("profile");

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/api/users/me")).data,
  });

  const { data: bData } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: async () => (await api.get("/api/bookings/my")).data,
  });

  const me = meData?.user || {};
  const bookings = bData?.bookings || [];

  const apiOrigin = useMemo(() => {
    const base = api?.defaults?.baseURL;
    if (typeof base === "string" && base.startsWith("http")) return base.replace(/\/$/, "");
    return import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";
  }, []);

  const initials = useMemo(() => {
    const raw = String(me?.name || "Rider").trim();
    return raw.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
  }, [me?.name]);

  function bookingRoute(b) {
    const offer = b.offerId;
    if (offer?.origin?.address || offer?.destination?.address) {
      return { from: offer.origin?.address || "Origin", to: offer.destination?.address || "Destination" };
    }
    const s = b.offerSnapshot || {};
    return { from: s.originAddress || "Origin", to: s.destinationAddress || "Destination" };
  }

  async function handleUpdateProfile() {
    try {
      setErr(""); setMsg(""); setSaving(true);
      const fd = new FormData();
      fd.append("name", name || me?.name || "");
      fd.append("contactNo", contactNo || me?.contactNo || "");
      if (avatar) fd.append("avatar", avatar);
      await api.patch("/api/users/me", fd, { headers: { "Content-Type": "multipart/form-data" } });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      setEditing(false); setAvatar(null);
      setMsg("Profile updated successfully.");
    } catch (e) {
      setErr(e?.response?.data?.message || "Update failed");
    } finally { setSaving(false); }
  }

  async function handleDeleteAccount() {
    if (!window.confirm("Are you sure?")) return;
    try {
      setDeleting(true);
      await api.delete("/api/users/me");
      await api.post("/api/auth/logout").catch(() => {});
      queryClient.clear();
      nav("/register", { replace: true });
    } catch (e) { setErr("Delete failed"); } finally { setDeleting(false); }
  }

  const NavItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`group flex w-full items-center gap-4 px-6 py-4 transition-all duration-500 relative ${
        activeTab === id 
        ? "text-white" 
        : "text-zinc-500 hover:text-[#B8860B]/80"
      }`}
    >
      {activeTab === id && (
        <div className="absolute inset-y-2 left-2 right-2 bg-gradient-to-r from-[#B8860B]/20 to-transparent rounded-xl border-l-2 border-[#B8860B]" />
      )}
      <Icon size={18} className={`${activeTab === id ? "text-[#B8860B]" : "group-hover:scale-110 transition-transform duration-300"}`} />
      <span className="text-xs font-bold tracking-[0.15em] uppercase">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#050506] text-zinc-100 font-sans selection:bg-[#B8860B]/30">
      
      {/* --- SIDEBAR --- */}
      <aside className="fixed top-12 left-0 h-full w-64 border-r border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-xl hidden md:flex flex-col z-30">
        <div className="p-8" />
        <nav className="flex-1 px-3 space-y-1">
          <NavItem id="profile" icon={User} label="Overview" />
          <NavItem id="bookings" icon={Calendar} label="Bookings" />
          <NavItem id="reviews" icon={Star} label="Ratings" />
          <NavItem id="leaderboard" icon={Trophy} label="Leaderboard" />
          <NavItem id="logOut" icon={LogOut} label="Log Out" />
        </nav>
        <div className="p-6 border-t border-zinc-800/50">
          <button onClick={handleDeleteAccount} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[10px] font-black text-zinc-500 hover:text-[#B8860B] hover:bg-[#B8860B]/5 transition-all tracking-widest uppercase">
            <LogOut size={14} />
            Terminate
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:ml-64 p-6 lg:p-0 space-y-10">
        
        {/* --- MAIN HERO (PROFILE ONLY) --- */}
        {activeTab === 'profile' && (
          <div className="relative group w-full max-w-[1400px] h-[400px] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] group-hover:scale-105"
              style={{ backgroundImage: `url(${heroBg})` }}
            />
            <div className="relative h-full flex flex-col justify-center p-12 md:p-20 bg-black/10">
              <div className="space-y-1">
                <h1 className="text-5xl font-black tracking-tighter text-[#E5E7EB] drop-shadow-lg">
                  Start Your Journey
                </h1>
                <h1 className="text-5xl font-black tracking-tighter text-[#B8860B] drop-shadow-lg">
                  With DropMe!
                </h1>
              </div>
              <p className="mt-4 text-zinc-200 text-lg font-medium italic opacity-90 max-w-md">
                Experience the elegance of modern travel with DropMe, where every ride is crafted for comfort, class, and convenience
              </p>
            </div>
          </div>
        )}

        <div className="max-w-[1400px]">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="lg:col-span-4 space-y-6">
                <div className="p-8 rounded-[2rem] bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md flex flex-col items-center text-center">
                  <div className="relative group cursor-pointer mb-6">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#B8860B] to-[#D4AF37] rounded-[2.2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    {me?.avatarUrl ? (
                      <img src={me.avatarUrl} className="relative h-28 w-28 rounded-[2rem] object-cover border-2 border-zinc-800" alt="Profile" />
                    ) : (
                      <div className="relative h-28 w-28 rounded-[2rem] bg-zinc-800 flex items-center justify-center text-3xl font-black text-[#B8860B] border border-zinc-700">{initials}</div>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">{me?.name}</h2>
                  <p className="text-zinc-500 text-sm mb-8 font-medium">{me?.email}</p>
                  
                  <button 
                    onClick={() => { setEditing(!editing); setErr(""); setMsg(""); }}
                    className="w-full py-4 rounded-xl bg-[#B8860B]/10 text-[#B8860B] border border-[#B8860B]/20 hover:bg-[#B8860B] hover:text-black transition-all font-black text-[10px] tracking-[0.2em] uppercase flex items-center justify-center gap-2"
                  >
                    <Settings size={14} />
                    {editing ? "Exit Settings" : "Account Settings"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/50 hover:border-violet-500/50 transition-colors group">
                    <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 mb-4 group-hover:scale-110 transition-transform">
                      <TrendingUp size={20} />
                    </div>
                    <p className="text-2xl font-black">Level 12</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Progress</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/50 hover:border-[#B8860B]/50 transition-colors group">
                    <div className="h-10 w-10 rounded-xl bg-[#B8860B]/10 flex items-center justify-center text-[#B8860B] mb-4 group-hover:scale-110 transition-transform">
                      <ShieldCheck size={20} />
                    </div>
                    <p className="text-2xl font-black">Secure</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Account</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8">
                {editing ? (
                  <div className="p-10 rounded-[2.5rem] bg-zinc-900/40 border border-[#B8860B]/20 backdrop-blur-md shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Settings size={120} className="text-[#B8860B]" />
                    </div>
                    <h3 className="text-xl font-black mb-8 uppercase tracking-widest text-white">Security & Identity</h3>
                    <div className="space-y-8 relative z-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Display Name</label>
                          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={me?.name} className="w-full bg-black/40 border border-zinc-800 rounded-xl px-5 py-4 focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] outline-none font-bold transition-all text-white" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Primary Contact</label>
                          <input value={contactNo} onChange={(e) => setContactNo(e.target.value)} placeholder={me?.contactNo || "Not set"} className="w-full bg-black/40 border border-zinc-800 rounded-xl px-5 py-4 focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] outline-none font-bold transition-all text-white" />
                        </div>
                      </div>
                      <div className="pt-4">
                        <button onClick={handleUpdateProfile} disabled={saving} className="w-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#B8860B] py-5 rounded-xl font-black text-black text-xs transition-all uppercase tracking-[0.2em] shadow-lg shadow-[#B8860B]/20 disabled:opacity-50">
                          {saving ? "Processing..." : "Commit Changes"}
                        </button>
                      </div>
                      {msg && <p className="text-emerald-400 text-[10px] text-center font-black uppercase tracking-widest bg-emerald-500/5 py-4 rounded-xl border border-emerald-500/10">{msg}</p>}
                      {err && <p className="text-red-400 text-[10px] text-center font-black uppercase tracking-widest bg-red-500/5 py-4 rounded-xl border border-red-500/10">{err}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[400px] rounded-[2.5rem] border border-dashed border-zinc-800 flex flex-col items-center justify-center p-12 text-center bg-zinc-900/20 group hover:border-[#B8860B]/30 transition-colors">
                    <div className="h-20 w-20 rounded-3xl bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800 group-hover:rotate-12 group-hover:border-[#B8860B]/50 transition-all duration-500">
                      <CreditCard size={32} className="text-[#B8860B]" />
                    </div>
                    <h4 className="text-lg font-bold mb-2 text-[#E5E7EB]">Account Activity</h4>
                    <p className="text-zinc-500 font-medium max-w-xs leading-relaxed">
                      Your recent activity and billing history will appear here. Select a tab to dive deeper.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              {/* --- BOOKINGS HERO (WITHOUT DARK OVERLAY) --- */}
              <div className="relative group w-full h-[400px] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-xl flex items-center">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] group-hover:scale-105"
                  style={{ backgroundImage: `url(${bookingsBg})` }}
                />
                
                {/* Content layer with drop shadow for text readability without darkening the whole image */}
                <div className="relative z-10 px-12 flex w-full items-center justify-between">
                  <div className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                    <h3 className="text-4xl font-black tracking-tighter uppercase italic text-black">
                      Pick Your <span className="text-[#B8860B]">Ride!</span>
                    </h3>
                    <p className="text-white text-sm font-medium mt-2 max-w-xs leading-relaxed">
                      Manage your active and past reservations or start a new adventure.
                    </p>
                  </div>
                  <Link to="/plan" className="px-10 py-5 bg-[#B8860B] text-black rounded-2xl text-[11px] font-black hover:bg-white hover:scale-105 transition-all shadow-2xl shadow-black uppercase tracking-[0.2em]">
                    Book Ride
                  </Link>
                </div>
              </div>

              <div className="grid gap-6">
                {bookings.length > 0 ? bookings.map((b) => {
                  const route = bookingRoute(b);
                  const canReceipt = b.status === "confirmed" || b.paymentStatus === "paid";
                  return (
                    <div key={b._id} className="group relative flex flex-col md:flex-row md:items-center justify-between p-8 bg-zinc-900/40 border border-zinc-800/50 rounded-[2rem] hover:border-[#B8860B]/50 transition-all hover:bg-zinc-900/60 shadow-xl">
                      <div className="flex items-center gap-8 mb-6 md:mb-0">
                        <div className="h-16 w-16 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center text-[#B8860B] group-hover:scale-110 group-hover:bg-[#B8860B] group-hover:text-black transition-all duration-500">
                          <MapPin size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 font-black text-xl tracking-tight">
                            <span className="text-zinc-100">{route.from}</span>
                            <ChevronRight size={18} className="text-[#B8860B]" />
                            <span className="text-zinc-100">{route.to}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 rounded-lg">
                              <User size={12} className="text-zinc-500" />
                              <span className="text-[10px] font-black text-zinc-300 uppercase">{b.seatsBooked} Pax</span>
                            </div>
                            <span className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                              b.status === 'confirmed' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/5 text-orange-500 border-orange-500/20'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={`${apiOrigin}/api/bookings/${b._id}/receipt`}
                        target="_blank" rel="noreferrer"
                        className={`px-10 py-4 rounded-xl font-black text-[10px] tracking-[0.2em] border border-[#B8860B]/20 bg-[#B8860B]/5 text-[#B8860B] hover:bg-[#B8860B] hover:text-black hover:border-[#B8860B] transition-all uppercase text-center shadow-lg shadow-black/40 ${!canReceipt && "opacity-20 pointer-events-none"}`}
                      >
                        Get Receipt
                      </a>
                    </div>
                  );
                }) : (
                  <div className="py-32 text-center border border-dashed border-zinc-800 rounded-[3rem] bg-zinc-900/20">
                    <p className="text-zinc-600 font-black uppercase tracking-[0.4em] text-xs">Zero movement detected</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === "reviews" && <RiderReviewsPage />}

          {activeTab === "leaderboard" && <RiderLeaderboardPage />}
          
        </div>
      </main>
    </div>
  );
}