function formatDistance(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "Distance unavailable";
  return `${num.toFixed(1)} km away`;
}

function getStationCode(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export default function NearestStationsSection({ nearestStations }) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-zinc-300">
          Nearest Active Stations
        </div>
        <div className="text-xs text-cyan-300">Nearby</div>
      </div>

      <div className="space-y-3">
        {nearestStations.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-4 text-sm text-zinc-500">
            Use your location to load nearest stations.
          </div>
        ) : (
          nearestStations.slice(0, 3).map((station) => (
            <article
              key={station._id}
              className="rounded-2xl border border-cyan-400/12 bg-slate-950/65 px-4 py-3"
            >
              <div className="text-sm font-medium text-white">{station.name}</div>
              <div className="mt-1 text-xs text-zinc-400">
                {getStationCode(station.name)} • {formatDistance(station.distanceKm)}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                ~{station.accessEstimateMinutes ?? "--"} mins access time
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
