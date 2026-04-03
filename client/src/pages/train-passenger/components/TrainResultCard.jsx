import { Armchair, Clock3, MapPin, TrainFront } from "lucide-react";

function safeLabel(value, fallback = "--") {
  return value || fallback;
}

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

export default function TrainResultCard({ train, active, onSelect }) {
  return (
    <article
      onClick={onSelect}
      className={`cursor-pointer rounded-[26px] border p-4 transition ${
        active
          ? "border-cyan-400/55 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.16)]"
          : "border-white/10 bg-white/[0.02] hover:border-cyan-400/30 hover:bg-cyan-400/[0.04]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`mt-1 flex h-12 w-12 items-center justify-center rounded-2xl ${
              active ? "bg-cyan-400/15 text-cyan-300" : "bg-white/5 text-zinc-300"
            }`}
          >
            <TrainFront className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold text-white">
                {safeLabel(train.trainName, "Unnamed service")}
              </h3>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs font-medium text-cyan-300">
                {safeLabel(train.trainNo)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <Armchair className="h-4 w-4" />
                Seat capacity: {train?.seatCapacity ?? "--"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4" />
                {safeLabel(train.durationLabel)}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
            active
              ? "bg-cyan-400 text-slate-950"
              : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
          }`}
        >
          {active ? "Selected" : "Select"}
        </button>
      </div>

<div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto] md:items-center">        <div>
          <div className="text-xs uppercase tracking-[0.12em] text-zinc-500">
            Boarding stop
          </div>
          <div className="mt-1 flex items-center gap-2 text-base font-medium text-white">
            <MapPin className="h-4 w-4 text-cyan-300" />
            {safeLabel(train?.boardingStation?.name)}
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            Departure: {formatTime12(train?.boardingStation?.departureTime)}
          </div>
          
        </div>

        <div className="text-center text-sm text-zinc-500">→</div>

        <div>
          <div className="text-xs uppercase tracking-[0.12em] text-zinc-500">
            Destination stop
          </div>
          <div className="mt-1 flex items-center gap-2 text-base font-medium text-white">
            <MapPin className="h-4 w-4 text-rose-300" />
            {safeLabel(train?.destinationStation?.name)}
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            Arrival: {formatTime12(train?.destinationStation?.arrivalTime)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs uppercase tracking-[0.12em] text-zinc-500">
            Status
          </div>
          <div className="mt-1 text-sm font-medium text-cyan-300">
            Ready to book
          </div>
        </div>
      </div>
    </article>
  );
}