import { Route } from "lucide-react";
import TrainStopTimelineCard from "./TrainStopTimelineCard";

export default function TrainStopsTimelineSection({ stops, segments = [] }) {
  return (
    <section className="rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(4,16,40,0.92),rgba(5,13,33,0.98))] p-5 shadow-[0_18px_60px_rgba(2,8,23,0.42)] md:p-7">
      <div className="mb-7 flex items-start gap-4">
        <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/6 ring-1 ring-white/8">
          <Route className="h-6 w-6 text-slate-300" />
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Route &amp; Stops</h2>
          <p className="mt-1 text-base text-white/60">{stops.length} stops along this journey</p>
        </div>
      </div>

      <div className="space-y-5">
        {stops.map((stop, index) => {
          const nextStop = stops[index + 1];
          const segment = nextStop
            ? segments.find(
                (seg) =>
                  String(seg.fromStationId?._id || seg.fromStationId) ===
                    String(stop.station?._id || stop.stationId) &&
                  String(seg.toStationId?._id || seg.toStationId) ===
                    String(nextStop.station?._id || nextStop.stationId)
              )
            : null;

          return (
            <TrainStopTimelineCard
              key={`${stop.order}-${stop.station?._id || stop.station?.name || "x"}`}
              stop={stop}
              index={index}
              totalStops={stops.length}
              nextSegmentFare={segment?.fareLkr}
            />
          );
        })}
      </div>
    </section>
  );
}
