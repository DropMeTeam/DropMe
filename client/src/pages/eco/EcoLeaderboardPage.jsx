import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Leaf,
  Train,
  Bus,
  CarFront,
  Fuel,
  Medal,
  ChevronRight,
} from "lucide-react";
import { getEcoLeaderboard, getMyEcoStats } from "../../lib/ecoApi";
import EcoHistoryView from "../../components/eco/EcoHistoryView";

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
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getModeIcon(mode, size = 18) {
  if (mode === "train") return <Train size={size} />;
  if (mode === "bus") return <Bus size={size} />;
  return <CarFront size={size} />;
}

function getModeLabel(mode) {
  if (mode === "train") return "Train";
  if (mode === "bus") return "Bus";
  return "Carpool";
}

export default function EcoLeaderboardPage({ onViewHistory }) {
  const [period, setPeriod] = useState("month");

  const leaderboardQuery = useQuery({
    queryKey: ["eco-leaderboard", period],
    queryFn: () => getEcoLeaderboard({ period, limit: 10 }),
  });

  const statsQuery = useQuery({
    queryKey: ["eco-stats-me"],
    queryFn: getMyEcoStats,
    retry: 1,
  });

  const leaderboard = Array.isArray(leaderboardQuery.data?.items)
    ? leaderboardQuery.data.items.slice(0, 10)
    : [];

  const recentImpactsRaw = Array.isArray(statsQuery.data?.recentImpacts)
    ? statsQuery.data.recentImpacts
    : [];

  const recentImpacts = recentImpactsRaw.slice(0, 3);

  const myRank =
    period === "lifetime"
      ? statsQuery.data?.lifetime?.rank ?? null
      : statsQuery.data?.month?.rank ?? null;

  const heroLabel = useMemo(() => {
    return period === "lifetime"
      ? "This lifetime’s leaderboard"
      : "This month’s leaderboard";
  }, [period]);

  const topThree = useMemo(() => {
    const rank1 = leaderboard.find((item) => Number(item.rank) === 1) || null;
    const rank2 = leaderboard.find((item) => Number(item.rank) === 2) || null;
    const rank3 = leaderboard.find((item) => Number(item.rank) === 3) || null;
    return [rank2, rank1, rank3].filter(Boolean);
  }, [leaderboard]);

  const remainingRanks = useMemo(() => {
    return leaderboard.filter((item) => Number(item.rank) > 3).slice(0, 7);
  }, [leaderboard]);

  const [activeView, setActiveView] = useState("leaderboard"); // NEW

  if (activeView === "history") {
    return (
      <EcoHistoryView 
        stats={statsQuery.data} 
        onBack={() => setActiveView("leaderboard")} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[28px] border border-emerald-400/15 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-6 shadow-[0_0_40px_rgba(16,185,129,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300/80">
                DropMe Eco Leaderboard
              </p>
              <h1 className="mt-3 text-2xl font-black md:text-2xl">
                Choose Smarter Trips. Earn Cleaner Wins.
              </h1>

              <p className="mt-3 max-w-3xl text-sm text-white/65 md:text-base">
                Bus, train, and carpool trips are compared against private
                solo-car travel, then converted into carbon savings and points.
              </p>
            </div>

            <div className="flex gap-2 self-start rounded-2xl border border-white/10 bg-black/20 p-2">
              <button
                type="button"
                onClick={() => setPeriod("month")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  period === "month"
                    ? "bg-emerald-400 text-black"
                    : "bg-transparent text-white/70 hover:bg-white/10"
                }`}
              >
                Monthly
              </button>

              <button
                type="button"
                onClick={() => setPeriod("lifetime")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  period === "lifetime"
                    ? "bg-emerald-400 text-black"
                    : "bg-transparent text-white/70 hover:bg-white/10"
                }`}
              >
                Lifetime
              </button>
              {/* ADD THIS BUTTON HERE */}
              <button 
         onClick={() => setActiveView("history")}
         className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition"
       >
         <ChevronRight size={16} className="text-emerald-400" />
         My Records
       </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <SummaryTile
              icon={<Trophy size={18} className="text-amber-300" />}
              title="My Monthly Rank"
              value={`#${statsQuery.data?.month?.rank || "-"}`}
              sub={`${formatNumber(
                statsQuery.data?.month?.monthPoints,
                0
              )} pts this month`}
            />

            <SummaryTile
              icon={<Leaf size={18} className="text-emerald-300" />}
              title="Lifetime CO2 Saved"
              value={`${formatNumber(
                statsQuery.data?.lifetime?.totalSavedKg,
                3
              )} kg`}
              sub={`${formatNumber(
                statsQuery.data?.lifetime?.totalTrips,
                0
              )} completed green trips`}
            />

            <SummaryTile
              icon={<Fuel size={18} className="text-sky-300" />}
              title="Fuel Equivalent"
              value={`${formatNumber(
                statsQuery.data?.lifetime?.totalFuelLiters,
                3
              )} L`}
              sub="Private-car petrol equivalent"
            />

            <SummaryTile
              icon={<Leaf size={18} className="text-lime-300" />}
              title="Monthly CO2 Saved"
              value={`${formatNumber(statsQuery.data?.month?.monthSavedKg, 3)} kg`}
              sub={`${formatNumber(
                statsQuery.data?.month?.monthTrips,
                0
              )} trips this month`}
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-10">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Rankings
                </p>
                <h2 className="mt-1 text-2xl font-black">{heroLabel}</h2>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                Top 10 riders
              </div>
            </div>

            {leaderboardQuery.isLoading ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-white/70">
                Loading leaderboard...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-white/70">
                No eco records yet.
              </div>
            ) : (
              <>
                {/* THE NEW CENTERED PODIUM LAYOUT */}
<div className="mt-8 grid gap-6 md:grid-cols-3 items-end max-w-4xl mx-auto">
  {/* Rank #2 - Left on desktop, 2nd on mobile */}
  <div className="order-2 md:order-1">
    {topThree[0] && (
      <PodiumCard 
        key={`${topThree[0].userId}-2`} 
        item={topThree[0]} 
        isCenter={false} 
      />
    )}
  </div>

  {/* Rank #1 - Center on desktop, 1st on mobile */}
  <div className="order-1 md:order-2">
    {topThree[1] && (
      <PodiumCard 
        key={`${topThree[1].userId}-1`} 
        item={topThree[1]} 
        isCenter={true} 
      />
    )}
  </div>

  {/* Rank #3 - Right on desktop, 3rd on mobile */}
  <div className="order-3 md:order-3">
    {topThree[2] && (
      <PodiumCard 
        key={`${topThree[2].userId}-3`} 
        item={topThree[2]} 
        isCenter={false} 
      />
    )}
  </div>
</div>

                <div className="mt-6 space-y-2 rounded-[24px] border border-white/10 bg-black/20 p-3">
                  {remainingRanks.map((item) => {
                    const isMine = Number(item.rank) === Number(myRank);

                    return (
                      <div
                        key={`${item.userId}-${item.rank}`}
                        className={`grid items-center gap-3 rounded-2xl px-4 py-4 transition md:grid-cols-[72px_minmax(0,1fr)_190px_120px] ${
                          isMine
                            ? "border border-emerald-400/20 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(52,211,153,0.08)]"
                            : "border border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="text-2xl font-black text-white/70">
                          #{item.rank}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-lg font-bold text-white">
                            {isMine
                              ? `You (${item.name || "rider"})`
                              : item.name || "Anonymous rider"}
                          </p>
                          <p className="text-sm text-white/45">
                            {formatNumber(item.savedKg, 3)} kg saved
                          </p>
                        </div>

                        <div className="text-sm text-white/55">
                          {formatNumber(item.trips, 0)} trips
                        </div>

                        <div className="text-right text-2xl font-black text-emerald-300">
                          {formatNumber(item.points, 0)} pts
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              My recent eco records
            </p>
            <h2 className="mt-1 text-2xl font-black">Latest carbon savings</h2>

            <div className="mt-5 space-y-3">
              {statsQuery.isLoading ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/70">
                  Loading recent records...
                </div>
              ) : recentImpacts.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/70">
                  No completed eco records yet.
                </div>
              ) : (
                recentImpacts.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-400/20 hover:bg-white/[0.035]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/10 bg-emerald-500/10 text-emerald-300">
                          {getModeIcon(item.mode, 18)}
                        </div>

                        <div>
                          <p className="text-lg font-bold text-white">
                            {getModeLabel(item.mode)}
                          </p>
                          <p className="text-sm text-white/45">
                            {formatCompactDate(item.occurredAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-black text-emerald-300">
                          +{formatNumber(item.points, 0)} pts
                        </p>
                        <p className="text-sm text-white/50">
                          {formatNumber(item.savedKg, 1)} kg
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => onViewHistory?.()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm font-medium text-white/70 transition hover:border-emerald-400/20 hover:bg-white/[0.03] hover:text-white"
            >
              View More History
              <ChevronRight size={16} />
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ icon, title, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
          {title}
        </p>
      </div>
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm text-white/50">{sub}</p>
    </div>
  );
}

function PodiumCard({ item, isCenter }) {
  const medalColor =
    Number(item.rank) === 1
      ? "from-amber-400 to-yellow-600"
      : Number(item.rank) === 2
      ? "from-slate-300 to-slate-500"
      : "from-orange-400 to-orange-700";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-5 transition-all ${
        isCenter
          ? "border-emerald-400/30 bg-emerald-500/[0.05] shadow-[0_20px_50px_rgba(0,0,0,0.3)] scale-105 z-10"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      {/* Subtle Background Rank Number */}
      <span className="absolute -right-2 -bottom-4 text-8xl font-black text-white/[0.03] select-none">
        {item.rank}
      </span>

      <div className="flex items-center gap-4">
        {/* Compact Medal Icon */}
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg ${medalColor}`}>
          <Trophy size={20} className="text-black/80" />
        </div>

        <div className="min-w-0 text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-white/40">
            Rank #{item.rank}
          </p>
          <h3 className="truncate text-xl font-bold text-white">
            {item.name || "Anonymous"}
          </h3>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-2xl font-black text-emerald-400">
            {formatNumber(item.points, 0)}
            <span className="ml-1 text-xs font-medium uppercase text-emerald-400/60">pts</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-tighter text-white/30">Impact</p>
          <p className="text-sm font-semibold text-white/70">{formatNumber(item.savedKg, 1)}kg</p>
        </div>
      </div>
    </div>
  );
}