import TrainResultCard from "./TrainResultCard";

export default function AvailableTrainsPanel({
  results,
  selectedTrainId,
  onSelectTrain,
  sortMode,
  onSortModeChange,
  searching,
  destinationStation,
}) {
  return (
    <section className="rounded-none  bg-[linear-gradient(180deg,rgba(6,12,24,0.96)_0%,rgba(3,7,15,0.96)_100%)] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-white">Available Trains</div>
          <div className="mt-1 text-sm text-zinc-400">
            {destinationStation ? `Services for ${destinationStation.name}` : "Search to see matching services"}
          </div>
        </div>

        <div className="inline-flex rounded-2xl border border-white/10 bg-black/20 p-1">
          <button
            type="button"
            onClick={() => onSortModeChange("earliest")}
            className={`rounded-xl px-4 py-2 text-sm transition ${
              sortMode === "earliest"
                ? "bg-white/10 text-cyan-300"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Earliest
          </button>
          <button
            type="button"
            onClick={() => onSortModeChange("fastest")}
            className={`rounded-xl px-4 py-2 text-sm transition ${
              sortMode === "fastest"
                ? "bg-white/10 text-cyan-300"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Fastest
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {searching ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-zinc-400">
            Searching trains...
          </div>
        ) : null}

        {!searching && results.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-zinc-500">
            No train results yet. Select location and destination, then run the search.
          </div>
        ) : null}

        {results.map((train) => (
          <TrainResultCard
            key={train._id}
            train={train}
            active={selectedTrainId === train._id}
            onSelect={() => onSelectTrain(train)}
          />
        ))}
      </div>
    </section>
  );
}
