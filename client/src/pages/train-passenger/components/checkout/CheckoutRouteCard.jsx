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
}) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,#171c27_0%,#0e1117_60%,#090b10_100%)] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            Selected Train
          </div>
          <div className="mt-2 text-xl font-semibold text-white">
            {trainName || "Train service"}
          </div>
          <div className="mt-1 text-sm text-cyan-300">{trainNo || "-"}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="rounded-[24px] bg-black/35 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
            From
          </div>
         <div className="mt-3 text-2xl font-bold leading-tight text-white">
  {boardingName || "Boarding station"}
</div>
<div className="mt-2 text-lg font-medium text-cyan-300">
  {formatTime12(departureTime)}
</div>
<div className="mt-1 text-sm text-zinc-500">
  Departure
</div>
        </div>

        <div className="flex items-center justify-center">
          <div className="h-px w-10 bg-white/10 md:w-16" />
          <div className="mx-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-zinc-400">
            Route
          </div>
          <div className="h-px w-10 bg-white/10 md:w-16" />
        </div>

        <div className="rounded-[24px] bg-black/35 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
            To
          </div>
          <div className="mt-3 text-2xl font-bold leading-tight text-white">
  {destinationName || "Destination station"}
</div>
<div className="mt-2 text-lg font-medium text-cyan-300">
  {formatTime12(arrivalTime)}
</div>
<div className="mt-1 text-sm text-zinc-500">
  Arrival
</div>
        </div>
      </div>
    </section>
  );
}
