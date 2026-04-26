import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bus,
  CarFront,
  Filter,
  Leaf,
  Train,
} from "lucide-react";
import { getMyEcoStats } from "../../lib/ecoApi";

function formatNumber(value, digits = 2) {
  const n = Number(value || 0);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function getModeLabel(mode) {
  if (mode === "train") return "Train";
  if (mode === "bus") return "Bus";
  return "Carpool";
}

function getModeIcon(mode) {
  if (mode === "train") return <Train size={18} />;
  if (mode === "bus") return <Bus size={18} />;
  return <CarFront size={18} />;
}

export default function EcoSavingsHistoryPage({ onBack }) {
  const [filter, setFilter] = useState("all");

  const statsQuery = useQuery({
    queryKey: ["eco-stats-me-history"],
    queryFn: getMyEcoStats,
    retry: 1,
  });

  const allImpacts = useMemo(() => {
    const data = statsQuery.data || {};

    const raw =
      data.allImpacts ||
      data.history ||
      data.impacts ||
      data.recentImpacts ||
      [];

    if (!Array.isArray(raw)) return [];

    return [...raw].sort((a, b) => {
      const ta = new Date(a?.occurredAt || 0).getTime();
      const tb = new Date(b?.occurredAt || 0).getTime();
      return tb - ta;
    });
  }, [statsQuery.data]);

  const filtered = useMemo(() => {
    if (filter === "all") return allImpacts;
    return allImpacts.filter((item) => item?.mode === filter);
  }, [allImpacts, filter]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, item) => {
        acc.savedKg += Number(item?.savedKg || 0);
        acc.points += Number(item?.points || 0);
        acc.trips += 1;
        return acc;
      },
      { savedKg: 0, points: 0, trips: 0 }
    );
  }, [filtered]);

  return (
    <div className="min-h-screen bg-[#030712] px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <button
                type="button"
                onClick={() => onBack?.()}
                className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/70 transition hover:bg-white/[0.03] hover:text-white"
              >
                <ArrowLeft size={16} />
                Back to leaderboard
              </button>

              <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/75">
                Eco savings history
              </p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">
                Your carbon savings journey
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-white/60">
                Review every saved trip, segmented by travel mode for faster
                analysis and cleaner rider insight.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All" },
                { key: "bus", label: "Bus" },
                { key: "train", label: "Train" },
                { key: "carpool", label: "Carpool" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    filter === item.key
                      ? "bg-emerald-400 text-black"
                      : "border border-white/10 bg-black/20 text-white/70 hover:bg-white/[0.03]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <MetricCard
              title="Trips"
              value={formatNumber(totals.trips, 0)}
              icon={<Filter size={16} className="text-emerald-300" />}
            />
            <MetricCard
              title="CO2 Saved"
              value={`${formatNumber(totals.savedKg, 3)} kg`}
              icon={<Leaf size={16} className="text-emerald-300" />}
            />
            <MetricCard
              title="Points Earned"
              value={`${formatNumber(totals.points, 0)} pts`}
              icon={<Leaf size={16} className="text-lime-300" />}
            />
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                Filtered history
              </p>
              <h2 className="mt-1 text-2xl font-black">
                {filter === "all"
                  ? "All eco trips"
                  : `${getModeLabel(filter)} trips`}
              </h2>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              {formatNumber(filtered.length, 0)} records
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {statsQuery.isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/70">
                Loading eco history...
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/70">
                No history found for this category.
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-400/20 hover:bg-white/[0.03]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/10 bg-emerald-500/10 text-emerald-300">
                        {getModeIcon(item.mode)}
                      </div>

                      <div>
                        <p className="text-lg font-bold">{getModeLabel(item.mode)}</p>
                        <p className="text-sm text-white/45">
                          {formatDate(item.occurredAt)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                      <MiniMetric
                        label="Saved"
                        value={`${formatNumber(item.savedKg, 3)} kg`}
                      />
                      <MiniMetric
                        label="Distance"
                        value={`${formatNumber(item.distanceKm, 3)} km`}
                      />
                      <MiniMetric
                        label="Passengers"
                        value={formatNumber(item.passengerCount, 0)}
                      />
                      <MiniMetric
                        label="Points"
                        value={`${formatNumber(item.points, 0)} pts`}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
          {title}
        </p>
      </div>
      <p className="mt-3 text-2xl font-black">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}