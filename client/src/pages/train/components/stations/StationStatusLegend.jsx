function LegendRow({ color, label, count }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs text-white/70">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span>{label}</span>
      </div>
      <span className="text-white/35">{count}</span>
    </div>
  );
}

export default function StationStatusLegend({ totalCount, activeCount, hasTempPick }) {
  const inactiveCount = Math.max(0, totalCount - activeCount);

  return (
    <div className="absolute bottom-4 right-4 z-[500] w-[170px] rounded-2xl border border-white/8 bg-[#0a1220]/90 p-3 shadow-[0_25px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55">
        Station Status
      </div>

      <div className="grid gap-2.5">
        <LegendRow color="#10b981" label="Operational" count={activeCount} />
        <LegendRow color="#f43f5e" label="Inactive" count={inactiveCount} />
        <LegendRow color="#60a5fa" label="Selected Point" count={hasTempPick ? 1 : 0} />
      </div>
    </div>
  );
}
