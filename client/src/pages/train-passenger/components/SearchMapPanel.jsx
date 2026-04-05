import RouteMap from "../../../components/RouteMap";

export default function SearchMapPanel({
  currentLocation,
  selectedTrain,
  boardingPoint,
  destinationPoint,
  routePoints,
  trainRoutePoints,
  routing,
}) {
  const hasAccessRoute = Array.isArray(routePoints) && routePoints.length > 1;
  const hasTrainRoute =
    Array.isArray(trainRoutePoints) && trainRoutePoints.length > 1;

  return (
    <section className="relative overflow-hidden rounded-none bg-[radial-gradient(circle_at_center,#0f2248_0%,#091223_45%,#050912_100%)] shadow-[0_20px_70px_rgba(0,0,0,0.45)]">
      <div className="absolute left-4 top-4 z-[401] rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur">
        <div className="text-xs text-zinc-400">Boarding station</div>
        <div className="font-medium text-white">
          {selectedTrain?.boardingStation?.name || "Boarding station not selected"}
        </div>

        <div className="mt-3 text-xs text-zinc-400">Destination station</div>
        <div className="font-medium text-white">
          {selectedTrain?.destinationStation?.name || "Destination not selected"}
        </div>
      </div>

      <div className="absolute right-4 top-4 z-[401] rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-zinc-300 backdrop-blur">
        {routing ? "Routing..." : "Live map"}
      </div>

      {(hasAccessRoute || hasTrainRoute) && (
        <div className="absolute bottom-4 left-4 z-[401] flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 text-xs text-zinc-200 backdrop-blur">
          {hasAccessRoute ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              My location → boarding
            </span>
          ) : null}

          {hasTrainRoute ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              Boarding → destination
            </span>
          ) : null}
        </div>
      )}

      <div className="h-[420px]">
        {selectedTrain ? (
          <RouteMap
            pickup={currentLocation}
            boardingPoint={boardingPoint}
            destinationPoint={destinationPoint}
            routePoints={routePoints}
            trainRoutePoints={trainRoutePoints}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-500">
            Search trains and select one result to render the map route.
          </div>
        )}
      </div>
    </section>
  );
}