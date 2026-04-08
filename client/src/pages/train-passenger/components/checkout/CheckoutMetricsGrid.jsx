import { Clock3, MapPinned } from "lucide-react";

export default function CheckoutMetricsGrid({
  journeyDistanceKm,
  journeyDurationLabel,
}) {
  const items = [
    {
      icon: MapPinned,
      label: "Journey Distance",
      value: `${Number(journeyDistanceKm || 0).toFixed(2)} km`,
      sub: "Estimated route distance",
      accent: "text-cyan-400",
    },
    {
      icon: Clock3,
      label: "Journey Time",
      value: journeyDurationLabel || "-",
      sub: "Estimated travel time",
      accent: "text-violet-400",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,#171c27_0%,#0e1117_60%,#090b10_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  {item.label}
                </div>
                <div className="mt-2 text-3xl font-bold tracking-tight text-white">
                  {item.value}
                </div>
                <div className="mt-1 text-sm text-zinc-400">{item.sub}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <Icon className={`h-6 w-6 ${item.accent}`} />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}