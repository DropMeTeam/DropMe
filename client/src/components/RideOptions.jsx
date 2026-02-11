import { CarTaxiFront, BusFront, Users } from "lucide-react";
import { cn } from "../lib/utils";

/**
 * Very small "pricing engine" for MVP demos.
 * Replace with your server-side pricing policy later.
 */
function formatLKR(n) {
  try {
    return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `LKR ${Math.round(n).toLocaleString()}`;
  }
}

export default function RideOptions({ metrics, mode, setMode }) {
  if (!metrics) {
    return (
      <div className="card p-5">
        <div className="text-sm font-semibold">Trip options</div>
        <div className="mt-1 text-sm text-zinc-400">Select pickup + destination to see options.</div>
      </div>
    );
  }

  const km = metrics.distanceKm;
  const mins = metrics.durationMins;

  // Pricing policy knobs
  const base = 120;
  const perKm = 80;

  const privateFare = base + km * perKm;
  const poolFare = privateFare * 0.8; // 20% discount
  const transitFare = Math.max(80, km * 25); // placeholder

  const items = [
    {
      key: "POOL",
      title: "Pool",
      subtitle: "Share the ride. Lower fare.",
      icon: Users,
      price: poolFare
    },
    {
      key: "PRIVATE",
      title: "Private",
      subtitle: "Direct ride. Faster routing.",
      icon: CarTaxiFront,
      price: privateFare
    },
    {
      key: "TRANSIT",
      title: "Transit",
      subtitle: "Public transport directions.",
      icon: BusFront,
      price: transitFare
    }
  ];

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">Trip options</div>
          <div className="mt-1 text-xs text-zinc-400">
            ~{km.toFixed(1)} km • ~{mins.toFixed(0)} mins (best route)
          </div>
        </div>
        <div className="text-xs text-zinc-500">Demo pricing (replace later)</div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {items.map((x) => {
          const Icon = x.icon;
          const active = mode === x.key;
          return (
            <button
              type="button"
              key={x.key}
              onClick={() => setMode(x.key)}
              className={cn(
                "text-left rounded-2xl border p-4 transition",
                active ? "border-white bg-white text-zinc-950" : "border-zinc-800 bg-zinc-950/30 hover:bg-zinc-950/60"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl", active ? "bg-zinc-950 text-white" : "bg-zinc-900/60")}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className={cn("text-sm font-semibold", active ? "text-zinc-950" : "text-zinc-100")}>
                  {formatLKR(x.price)}
                </div>
              </div>
              <div className={cn("mt-3 font-medium", active ? "text-zinc-950" : "text-zinc-100")}>{x.title}</div>
              <div className={cn("mt-1 text-sm", active ? "text-zinc-700" : "text-zinc-400")}>{x.subtitle}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
