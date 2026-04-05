import { ArrowRight, Clock3, MapPin } from "lucide-react";
import {
  buildLocationLabel,
  formatTime12,
  getStopBadge,
  getStopIndicatorClasses,
} from "./trainScheduleDetails.utils";

export default function TrainStopTimelineCard({ stop, index, totalStops }) {
  const badge = getStopBadge(index, totalStops);
  const indicatorClasses = getStopIndicatorClasses(index, totalStops);

  return (
    <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 md:gap-6">
      <div className="relative flex justify-center">
        {index !== totalStops - 1 ? (
          <span className="absolute left-1/2 top-8 h-[calc(100%+1.8rem)] w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(59,130,246,0.55),rgba(148,163,184,0.15))]" />
        ) : null}

        <span
          className={`relative mt-1 block h-7 w-7 rounded-full border shadow-[0_0_28px_rgba(37,99,235,0.30)] ${indicatorClasses}`}
        />
      </div>

      <article className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,38,72,0.90),rgba(11,23,49,0.92))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:p-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium text-[#7fa6d6]">Stop {stop.order ?? index + 1}</span>

          {badge ? (
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          ) : null}
        </div>

        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
          {stop.station?.name || "Unknown station"}
        </h3>

        <div className="mt-2 flex items-center gap-2 text-sm text-[#7d93b7]">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{buildLocationLabel(stop.station?.location)}</span>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          <div className="rounded-2xl bg-white/5 px-5 py-4 ring-1 ring-white/5">
            <div className="flex items-center gap-2 text-sm text-[#8aa0c3]">
              <Clock3 className="h-4 w-4" />
              Arrival
            </div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-white">
              {formatTime12(stop.arrivalTime)}
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 px-5 py-4 ring-1 ring-white/5">
            <div className="flex items-center gap-2 text-sm text-[#8aa0c3]">
              <ArrowRight className="h-4 w-4" />
              Departure
            </div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-white">
              {formatTime12(stop.departureTime)}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
