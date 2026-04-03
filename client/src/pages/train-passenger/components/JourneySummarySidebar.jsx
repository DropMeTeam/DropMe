import { Link } from "react-router-dom";
import { Clock3, MapPinned, Route, Ticket, TrainFront } from "lucide-react";

function formatFare(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Calculated in checkout";
  return `LKR ${amount.toFixed(2)}`;
}

export default function JourneySummarySidebar({
  selectedTrain,
  accessRouteMeta,
  scheduleHref,
  bookingHref,
  selectedFare,
}) {
  return (
<aside className="h-full min-h-[calc(100vh-72px)] border-l border-cyan-400/10 bg-[radial-gradient(circle_at_top,#111c39_0%,#09101e_48%,#060a12_100%)] p-5 shadow-none rounded-none xl:sticky xl:top-0">      <div className="mb-5 text-2xl font-semibold text-white">Journey Summary</div>

      {!selectedTrain ? (
        <div className="rounded-[24px] border border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-zinc-400">
          Select a train from the middle panel to populate the summary sidebar.
        </div>
      ) : (
        <>
          <section className="rounded-[24px] border border-cyan-400/15 bg-black/20 p-4">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-1 h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
                <div>
                  <div className="text-lg font-medium text-white">
                    {selectedTrain?.boardingStation?.departureTime || "--"}
                  </div>
                  <div className="text-sm text-zinc-300">
                    {selectedTrain?.boardingStation?.name || "Nearest station"}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {selectedTrain?.boardingStation?.distanceKm ?? "--"} km • ~{selectedTrain?.boardingStation?.accessEstimateMinutes ?? "--"} mins from current location
                  </div>
                </div>
              </div>

              <div className="ml-[5px] border-l border-dashed border-cyan-400/40 pl-6">
                <div className="inline-flex items-center gap-2 text-sm text-zinc-400">
                  <TrainFront className="h-4 w-4" />
                  {selectedTrain?.trainName || selectedTrain?.trainNo || "Selected train"} • {selectedTrain?.durationLabel || "--"}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1 h-3 w-3 rounded-full border border-cyan-400 bg-transparent" />
                <div>
                  <div className="text-lg font-medium text-white">
                    {selectedTrain?.destinationStation?.arrivalTime || "--"}
                  </div>
                  <div className="text-sm text-zinc-300">
                    {selectedTrain?.destinationStation?.name || "Destination station"}
                  </div>
                  <div className="text-xs text-zinc-500">
                    Train journey time: {selectedTrain?.durationLabel || "--"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4">
            <div className="mb-3 text-xs uppercase tracking-[0.14em] text-zinc-500">
              Journey Metrics
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 text-zinc-300">
                <span className="inline-flex items-center gap-2">
                  <MapPinned className="h-4 w-4 text-cyan-300" />
                  Access route distance
                </span>
                <span>{accessRouteMeta ? `${accessRouteMeta.distanceKm.toFixed(2)} km` : `${selectedTrain?.boardingStation?.distanceKm ?? "--"} km`}</span>
              </div>

              <div className="flex items-center justify-between gap-3 text-zinc-300">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-cyan-300" />
                  Access route time
                </span>
                <span>{accessRouteMeta ? `~${Math.round(accessRouteMeta.durationMins)} mins` : `~${selectedTrain?.boardingStation?.accessEstimateMinutes ?? "--"} mins`}</span>
              </div>

              <div className="flex items-center justify-between gap-3 text-zinc-300">
                <span className="inline-flex items-center gap-2">
                  <Route className="h-4 w-4 text-cyan-300" />
                  Train duration
                </span>
                <span>{selectedTrain?.durationLabel || "--"}</span>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4">
            <div className="mb-3 text-xs uppercase tracking-[0.14em] text-zinc-500">
              Selected Train Fee
            </div>

            <div className="flex items-center justify-between gap-3 text-zinc-300">
              <span className="inline-flex items-center gap-2">
                <Ticket className="h-4 w-4 text-cyan-300" />
                Journey fare
              </span>
              <span className="text-xl font-semibold text-cyan-300">
                {formatFare(selectedFare)}
              </span>
            </div>
          </section>

          <section className="mt-5 space-y-3">
            <Link
              to={scheduleHref}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-sm font-medium text-white transition hover:bg-white/[0.05]"
            >
              View Schedule
            </Link>

            <Link
              to={bookingHref}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-cyan-400 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.35)] transition hover:brightness-110"
            >
              Book Now
            </Link>
          </section>
        </>
      )}
    </aside>
  );
}
