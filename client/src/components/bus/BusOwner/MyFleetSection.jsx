import { useMemo, useState } from "react";
import { api } from "../../../lib/api";

function getShortPlaceName(value) {
  if (!value || typeof value !== "string") return "-";

  if (value.includes(" - ")) {
    const rightPart = value.split(" - ").pop()?.trim();
    if (rightPart) return rightPart;
  }

  return value.split(",")[0]?.trim() || "-";
}

function getImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;

  const baseUrl = api?.defaults?.baseURL || "http://localhost:5000";
  const cleanBase = String(baseUrl).replace(/\/$/, "");

  return `${cleanBase}${url.startsWith("/") ? "" : "/"}${url}`;
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();

  const styles = {
    approved: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
    pending: "border-amber-500/30 bg-amber-500/15 text-amber-300",
    rejected: "border-red-500/30 bg-red-500/15 text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
        styles[normalized] || "border-white/10 bg-white/5 text-zinc-300"
      }`}
    >
      {normalized || "unknown"}
    </span>
  );
}

function FleetCard({ bus }) {
  const busImage = getImageUrl(bus?.photoUrl);
  const routeNo = bus?.routeId?.routeNumber || "-";
  const start = getShortPlaceName(bus?.routeId?.start?.label);
  const end = getShortPlaceName(bus?.routeId?.end?.label);
  const features =
    Array.isArray(bus?.features) && bus.features.length > 0 ? bus.features : [];

  return (
    <div className="group overflow-hidden rounded-[28px] border border-white/10 bg-[#11161f] shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:border-emerald-400/20 hover:shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
      <div className="relative h-48 w-full overflow-hidden bg-[#0b0f16]">
        {busImage ? (
          <img
            src={busImage}
            alt={bus?.plateNumber || "Bus"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
            No bus photo
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f16] via-[#0b0f16]/35 to-transparent" />

        <div className="absolute left-4 top-4">
          <StatusBadge status={bus?.status} />
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Bus No</p>
          <h3 className="mt-1 text-xl font-bold text-white">
            {bus?.plateNumber || "-"}
          </h3>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Route No</p>
            <p className="mt-1 text-sm font-semibold text-white">{routeNo}</p>
          </div>

          <div className="rounded-2xl bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Seats</p>
            <p className="mt-1 text-sm font-semibold text-white">{bus?.seatsTotal || "-"}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Route</p>
          <p className="mt-2 text-sm font-medium text-zinc-200">
            {start} <span className="mx-2 text-zinc-500">→</span> {end}
          </p>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Features</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {features.length > 0 ? (
              features.map((feature, index) => (
                <span
                  key={`${feature}-${index}`}
                  className="rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200"
                >
                  {feature}
                </span>
              ))
            ) : (
              <span className="text-sm text-zinc-500">No features added</span>
            )}
          </div>
        </div>

        {bus?.reviewNote ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
            {bus.reviewNote}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function MyFleetSection({ buses = [] }) {
  const [activeTab, setActiveTab] = useState("approved");

  const grouped = useMemo(() => {
    return {
      approved: buses.filter((bus) => String(bus?.status || "").toLowerCase() === "approved"),
      pending: buses.filter((bus) => String(bus?.status || "").toLowerCase() === "pending"),
      rejected: buses.filter((bus) => String(bus?.status || "").toLowerCase() === "rejected"),
    };
  }, [buses]);

  const tabConfig = [
    {
      key: "approved",
      label: "Approved",
      count: grouped.approved.length,
      activeClass: "bg-emerald-500 text-black",
      idleClass: "bg-white/5 text-white hover:bg-white/10",
    },
    {
      key: "pending",
      label: "Pending",
      count: grouped.pending.length,
      activeClass: "bg-amber-400 text-black",
      idleClass: "bg-white/5 text-white hover:bg-white/10",
    },
    {
      key: "rejected",
      label: "Rejected",
      count: grouped.rejected.length,
      activeClass: "bg-red-400 text-black",
      idleClass: "bg-white/5 text-white hover:bg-white/10",
    },
  ];

  const activeBuses = grouped[activeTab] || [];
  const activeTitle =
    activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {tabConfig.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition ${
                isActive ? tab.activeClass : tab.idleClass
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white">{activeTitle}</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {activeBuses.length} {activeBuses.length === 1 ? "bus" : "buses"}
        </p>
      </div>

      {activeBuses.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {activeBuses.map((bus) => (
            <FleetCard key={bus._id} bus={bus} />
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-zinc-500">
          No buses in this section
        </div>
      )}
    </div>
  );
}