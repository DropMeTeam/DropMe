import { useQuery } from "@tanstack/react-query";
import { Leaf, Trophy, Fuel, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getMyEcoStats } from "../../lib/ecoApi";

function formatNumber(value, digits = 2) {
  const n = Number(value || 0);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export default function EcoSummaryCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["eco-stats-me"],
    queryFn: getMyEcoStats,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-5 text-white">
        Loading eco summary...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-500/5 p-5 text-white">
        Could not load eco summary.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(15,23,42,0.7))] p-5 text-white shadow-[0_0_30px_rgba(16,185,129,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300/80">
            Eco Impact
          </p>
          <h3 className="mt-2 text-2xl font-black">Travel Green, Rank Higher</h3>
          <p className="mt-2 max-w-xl text-sm text-white/65">
            Your completed bus, train, and carpool trips become carbon savings and leaderboard points.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3">
          <Leaf size={24} className="text-emerald-300" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <StatBox
          icon={<Trophy size={18} className="text-amber-300" />}
          label="This Month"
          value={`${formatNumber(data?.month?.monthPoints, 0)} pts`}
          sub={`Rank #${data?.month?.rank || "-"}`}
        />

        <StatBox
          icon={<Leaf size={18} className="text-emerald-300" />}
          label="CO2 Saved"
          value={`${formatNumber(data?.lifetime?.totalSavedKg, 3)} kg`}
          sub={`${formatNumber(data?.lifetime?.totalTrips, 0)} green trips`}
        />

        <StatBox
          icon={<Fuel size={18} className="text-sky-300" />}
          label="Fuel Equivalent"
          value={`${formatNumber(data?.lifetime?.totalFuelLiters, 3)} L`}
          sub="Private-car petrol equivalent"
        />

        <Link
          to="/eco"
          className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-emerald-300/30 hover:bg-white/10"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">
              Open
            </p>
            <p className="mt-2 text-lg font-bold">Leaderboard</p>
          </div>
          <ArrowRight className="transition group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs uppercase tracking-[0.2em] text-white/55">{label}</p>
      </div>

      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm text-white/55">{sub}</p>
    </div>
  );
}