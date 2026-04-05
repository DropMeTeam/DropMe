import { Clock3, GitBranch, MapPinned, TrainFront } from "lucide-react";

export default function CheckoutMetricsGrid({
  trainName,
  trainNo,
  segmentCount,
  journeyDistanceKm,
  journeyDurationLabel,
}) {
  const items = [
    {
      icon: TrainFront,
      label: "Train",
      value: trainName,
      sub: trainNo,
    },
    {
      icon: GitBranch,
      label: "Segments",
      value: segmentCount,
      sub: "Selected route",
    },
    {
      icon: MapPinned,
      label: "Distance",
      value: `${Number(journeyDistanceKm || 0).toFixed(2)} km`,
      sub: "Estimated",
    },
    {
      icon: Clock3,
      label: "Duration",
      value: journeyDurationLabel || "-",
      sub: "Travel time",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,#171c27_0%,#0e1117_60%,#090b10_100%)] p-5"
          >
            <Icon className="h-5 w-5 text-cyan-400" />
            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
              {item.label}
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {item.value}
            </div>
            <div className="mt-1 text-sm text-zinc-400">{item.sub}</div>
          </div>
        );
      })}
    </section>
  );
}
