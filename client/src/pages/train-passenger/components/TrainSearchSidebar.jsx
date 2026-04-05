import CurrentLocationSection from "./CurrentLocationSection";
import PlanJourneySection from "./PlanJourneySection";
import NearestStationsSection from "./NearestStationsSection";

export default function TrainSearchSidebar({
  currentLocation,
  locating,
  onUseMyLocation,
  stations,
  loadingStations,
  fromStationId,
  onFromChange,
  destinationStationId,
  onDestinationChange,
  day,
  onDayChange,
  onSearch,
  canSearch,
  searching,
  nearestStations,
}) {
  return (
<aside className="h-full min-h-[calc(100vh-72px)] border-r border-cyan-500/10 bg-[radial-gradient(circle_at_top,#12203f_0%,#09101f_50%,#070b14_100%)] pl-8 pr-4 py-4 shadow-none rounded-none xl:sticky xl:top-0">
    <div className="mb-4 flex items-center gap-3 border-b border-white/10 px-2 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/25">
          <span className="text-lg font-bold">D</span>
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide text-white">DropMe Rail</div>
          <div className="text-xs text-cyan-100/60">Smart train booking</div>
        </div>
      </div>

      <div className="space-y-4">
        <CurrentLocationSection
          currentLocation={currentLocation}
          locating={locating}
          onUseMyLocation={onUseMyLocation}
        />

        <PlanJourneySection
          stations={stations}
          loadingStations={loadingStations}
          fromStationId={fromStationId}
          onFromChange={onFromChange}
          destinationStationId={destinationStationId}
          onDestinationChange={onDestinationChange}
          day={day}
          onDayChange={onDayChange}
          onSearch={onSearch}
          canSearch={canSearch}
          searching={searching}
        />

        <NearestStationsSection nearestStations={nearestStations} />
      </div>
    </aside>
  );
}
