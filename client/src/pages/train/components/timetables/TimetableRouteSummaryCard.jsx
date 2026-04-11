import { CalendarDays, Route, TrainFront } from "lucide-react";

function getFirstDayStops(week) {
  return week?.Mon || [];
}

export default function TimetableRouteSummaryCard({ selected, week }) {
  const previewStops = getFirstDayStops(week);

  return (
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,28,40,0.96)_0%,rgba(11,17,27,0.96)_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-100">
          <Route className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-white">Route summary</h3>
          <p className="mt-1 text-sm text-white/45">
            Quick view of the selected train and stop sequence.
          </p>
        </div>
      </div>

      {!selected ? (
        <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/40">
          No train selected yet.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/75">
                <TrainFront className="h-4 w-4" />
              </span>
              <div>
                <div className="text-base font-semibold text-white">
                  {selected.trainNo} {selected.trainName ? `• ${selected.trainName}` : ""}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-white/55">
                    Seats {selected.seatCapacity}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-white/55">
                    Stops {selected.stops?.length || 0}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-white/55">
                    Distance {selected.totalDistanceKm ?? 0} km
                  </span>
                  <span className={`rounded-full px-2.5 py-1 ${selected.active ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border border-white/10 bg-white/[0.03] text-white/50"}`}>
                    {selected.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <CalendarDays className="h-4 w-4 text-blue-200" />
              Monday stop preview
            </div>

            <div className="space-y-3">
              {previewStops.map((stop, index) => (
                <div
                  key={`${stop.stationId}-${index}`}
                  className="rounded-2xl border border-white/8 bg-black/15 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {index + 1}. {stop.stationName}
                      </div>
                      <div className="mt-1 text-xs text-white/35">
                        Arrival {stop.arrivalTime || "—"} • Departure {stop.departureTime || "—"}
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/45">
                      Stop {stop.order}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
