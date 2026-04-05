import { ArrowRight, LockKeyhole, ShieldCheck, TrainFront } from "lucide-react";
import checkoutHeroImage from "./assets/checkout-hero.png";

function formatTime12(time, fallback = "--") {
  if (!time || typeof time !== "string" || !time.includes(":")) return fallback;

  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return fallback;

  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export default function CheckoutRouteCard({
  trainName,
  trainNo,
  boardingName,
  destinationName,
  departureTime,
  arrivalTime,
  segmentCount,
}) {
  const segmentLabel = `${segmentCount || 0} ${(segmentCount || 0) === 1 ? "segment" : "segments"}`;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1220] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] sm:p-6">
  <div
    className="absolute inset-0 bg-cover bg-center opacity-100"
    style={{
      backgroundImage: `url(${checkoutHeroImage})`,
      // brighter and more colorful than before
      filter: "saturate(1.2) contrast(1.04) brightness(1.08)",
    }}
  />

  {/* softer dark overlay so image is still visible */}
  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,10,18,0.68)_0%,rgba(6,10,18,0.38)_48%,rgba(6,10,18,0.62)_100%)]" />

  {/* blue glow layer without killing image colors */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.22),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.06),rgba(2,6,23,0.22))]" />

  <div className="relative z-10 flex h-full flex-col gap-6">  <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/12 px-3 py-1.5 text-cyan-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Route Confirmed
            </span>
            <span className="text-zinc-300/90">Booking Ref: #{trainNo || "TRAIN"}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300">
              {segmentLabel}
            </span>
          </div>

          <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-medium text-zinc-200 backdrop-blur-md">
            {trainName || "Train service"}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
              Departure
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-4xl font-bold leading-none tracking-tight text-white sm:text-5xl">
                {formatTime12(departureTime)}
              </div>
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {boardingName || "Boarding station"}
            </div>
            <div className="mt-1 text-sm text-zinc-400">Selected origin locked for checkout</div>
          </div>

          <div className="flex items-center justify-center gap-3 lg:flex-col">
            <div className="hidden h-px w-20 bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent lg:block" />
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-[20px] border border-cyan-400/20 bg-black/25 backdrop-blur-md shadow-[0_0_22px_rgba(14,165,233,0.22)]">
              <div className="relative">
                <LockKeyhole className="h-5 w-5 text-cyan-300" />
                <TrainFront className="absolute -right-4 top-5 h-3.5 w-3.5 text-cyan-400" />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300 backdrop-blur-md">
              Locked Route
              <ArrowRight className="h-3.5 w-3.5 text-cyan-300" />
            </div>
            <div className="hidden h-px w-20 bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent lg:block" />
          </div>

          <div className="min-w-0 text-left lg:text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
              Arrival
            </div>
            <div className="mt-2 text-4xl font-bold leading-none tracking-tight text-white sm:text-5xl">
              {formatTime12(arrivalTime)}
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {destinationName || "Destination station"}
            </div>
            <div className="mt-1 text-sm text-zinc-400">Selected destination locked for checkout</div>
          </div>
        </div>
      </div>
    </section>
  );
}
