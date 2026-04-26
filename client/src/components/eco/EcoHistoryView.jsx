import React, { useMemo, useState } from "react";
import { Train, Bus, CarFront, ChevronLeft, LayoutGrid } from "lucide-react";

function formatNumber(value, digits = 2) {
  const n = Number(value || 0);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function formatCompactDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EcoHistoryView({ stats, onBack }) {
  const [activeTab, setActiveTab] = useState("all");

  const impacts = useMemo(() => stats?.recentImpacts || [], [stats]);

  const tabs = [
    { id: "all", label: "All", icon: <LayoutGrid size={16} /> },
    { id: "train", label: "Train", icon: <Train size={16} /> },
    { id: "bus", label: "Bus", icon: <Bus size={16} /> },
    { id: "carpool", label: "Carpool", icon: <CarFront size={16} /> },
  ];

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return impacts;
    if (activeTab === "carpool") {
      return impacts.filter((i) => i.mode === "carpool" || i.mode === "car");
    }
    return impacts.filter((i) => i.mode === activeTab);
  }, [impacts, activeTab]);

  return (
    <div className="min-h-screen bg-[#030712] px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold">Back to Leaderboard</span>
        </button>

        <header className="mb-8">
          <h1 className="text-4xl font-black italic tracking-tight uppercase">My Eco Activity</h1>
          <p className="text-white/40 mt-2">A detailed breakdown of your carbon-saving journeys.</p>
        </header>

        {/* TAB NAVIGATION */}
        <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* LIST VIEW */}
        <div className="space-y-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <HistoryItem key={item._id} item={item} />
            ))
          ) : (
            <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
              <p className="text-white/30">No records found for this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryItem({ item }) {
  // Determine icon based on mode
  const getIcon = (mode) => {
    if (mode === "train") return <Train className="text-sky-400" size={20} />;
    if (mode === "bus") return <Bus className="text-emerald-400" size={20} />;
    return <CarFront className="text-amber-400" size={20} />;
  };

  return (
    <div className="group flex justify-between items-center bg-white/[0.02] hover:bg-white/[0.04] p-5 rounded-3xl border border-white/5 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white/5 rounded-2xl">
          {getIcon(item.mode)}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-white/90">
            {formatCompactDate(item.occurredAt)}
          </span>
          <span className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-bold">
            {item.mode} • {item.distanceKm || 0} KM Traveled
          </span>
        </div>
      </div>

      <div className="text-right">
        <div className="text-xl font-black text-emerald-400 leading-none">
          +{formatNumber(item.points, 0)} 
          <span className="text-[10px] ml-1 text-emerald-400/50 uppercase">pts</span>
        </div>
        <div className="text-[11px] font-bold text-white/40 mt-1 uppercase tracking-tighter">
          {formatNumber(item.savedKg, 2)}kg CO2 Saved
        </div>
      </div>
    </div>
  );
}