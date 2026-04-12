import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Leaf, Train, Bus, CarFront, Fuel } from "lucide-react";
import { getEcoLeaderboard, getMyEcoStats } from "../../lib/ecoApi";

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

function getModeIcon(mode) {
  if (mode === "train") return <Train size={16} />;
  if (mode === "bus") return <Bus size={16} />;
  return <CarFront size={16} />;
}

export default function EcoLeaderboardPage() {
  const [period, setPeriod] = useState("month");

  const leaderboardQuery = useQuery({
    queryKey: ["eco-leaderboard", period],
    queryFn: () => getEcoLeaderboard({ period, limit: 20 }),
  });

  const statsQuery = useQuery({
    queryKey: ["eco-stats-me"],
    queryFn: getMyEcoStats,
    retry: 1,
  });

  const leaderboard = leaderboardQuery.data?.items || [];
  const recentImpacts = statsQuery.data?.recentImpacts || [];

  const heroLabel = useMemo(() => {
    return period === "lifetime" ? "Lifetime leaderboard" : "This month’s leaderboard";
  }, [period]);

  return (
    <div className="min-h-screen bg-[#030712] px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[28px] border border-emerald-400/15 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-6 shadow-[0_0_40px_rgba(16,185,129,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300/80">
                DropMe Eco Leaderboard
              </p>
              <h1 className="mt-3 text-3xl font-black md:text-5xl">
                Choose Smarter Trips. Earn Cleaner Wins.
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-white/65 md:text-base">
                Bus, train, and carpool trips are compared against private solo-car travel, then converted into carbon savings and points.
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
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <SummaryTile
              icon={<Trophy size={18} className="text-amber-300" />}
              title="My Monthly Rank"
              value={`#${statsQuery.data?.month?.rank || "-"}`}
              sub={`${formatNumber(statsQuery.data?.month?.monthPoints, 0)} pts this month`}
            />

            <SummaryTile
              icon={<Leaf size={18} className="text-emerald-300" />}
              title="Lifetime CO2 Saved"
              value={`${formatNumber(statsQuery.data?.lifetime?.totalSavedKg, 3)} kg`}
              sub={`${formatNumber(statsQuery.data?.lifetime?.totalTrips, 0)} completed green trips`}
            />

            <SummaryTile
              icon={<Fuel size={18} className="text-sky-300" />}
              title="Fuel Equivalent"
              value={`${formatNumber(statsQuery.data?.lifetime?.totalFuelLiters, 3)} L`}
              sub="Private-car petrol equivalent"
            />

            <SummaryTile
              icon={<Leaf size={18} className="text-lime-300" />}
              title="Monthly CO2 Saved"
              value={`${formatNumber(statsQuery.data?.month?.monthSavedKg, 3)} kg`}
              sub={`${formatNumber(statsQuery.data?.month?.monthTrips, 0)} trips this month`}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Rankings
                </p>
                <h2 className="mt-1 text-2xl font-black">{heroLabel}</h2>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                Top 20 riders
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {leaderboardQuery.isLoading ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/70">
                  Loading leaderboard...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/70">
                  No eco records yet.
                </div>
              ) : (
                leaderboard.map((item) => (
                  <div
                    key={`${item.userId}-${item.rank}`}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-black">
                        #{item.rank}
                      </div>

                      <div>
                        <p className="text-lg font-bold">{item.name || "Anonymous rider"}</p>
                        <p className="text-sm text-white/50">
                          {item.email || "No email shown"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <MiniMetric label="Points" value={`${formatNumber(item.points, 0)} pts`} />
                      <MiniMetric label="CO2 Saved" value={`${formatNumber(item.savedKg, 3)} kg`} />
                      <MiniMetric label="Trips" value={formatNumber(item.trips, 0)} />
                    </div>
                  </div>
                ))
              )}
            </div>
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
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-emerald-300">
                        {getModeIcon(item.mode)}
                        <span className="text-sm font-semibold uppercase tracking-[0.15em]">
                          {item.mode}
                        </span>
                      </div>

                      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                        +{formatNumber(item.points, 0)} pts
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <MiniMetric label="Saved" value={`${formatNumber(item.savedKg, 3)} kg`} />
                      <MiniMetric label="Distance" value={`${formatNumber(item.distanceKm, 3)} km`} />
                      <MiniMetric label="Passengers" value={formatNumber(item.passengerCount, 0)} />
                    </div>

                    <p className="mt-4 text-sm text-white/50">
                      {formatDate(item.occurredAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
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
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">{title}</p>
      </div>
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm text-white/50">{sub}</p>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}