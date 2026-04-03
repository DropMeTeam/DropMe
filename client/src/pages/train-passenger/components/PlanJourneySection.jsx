import { CalendarDays, ChevronDown, MapPinned, Search } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PlanJourneySection({
  stations,
  loadingStations,
  destinationStationId,
  onDestinationChange,
  day,
  onDayChange,
  onSearch,
  canSearch,
  searching,
}) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-black/20 p-4">
      <div className="mb-4 border-b border-white/10 pb-3 text-xl font-semibold text-white">
        Plan Journey
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-400">
            Destination Station
          </label>

          <div className="relative">
            <MapPinned className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

            <select
              value={destinationStationId}
              onChange={(e) => onDestinationChange(e.target.value)}
              disabled={loadingStations}
              className="h-12 w-full appearance-none rounded-2xl border border-cyan-400/15 bg-slate-950/70 py-3 pl-10 pr-10 text-sm text-white outline-none transition focus:border-cyan-400/45"
            >
              <option value="">Select destination...</option>
              {stations.map((station) => (
                <option key={station._id} value={station._id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-400">
            Travel Day
          </label>

          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

            <select
              value={day}
              onChange={(e) => onDayChange(e.target.value)}
              className="h-12 w-full appearance-none rounded-2xl border border-cyan-400/15 bg-slate-950/70 py-3 pl-10 pr-10 text-sm text-white outline-none transition focus:border-cyan-400/45"
            >
              <option value="">Any / base schedule</option>
              {DAYS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={onSearch}
          disabled={!canSearch || searching}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Search className="mr-2 h-4 w-4" />
          {searching ? "Searching..." : "Search Trains"}
        </button>
      </div>
    </section>
  );
}
