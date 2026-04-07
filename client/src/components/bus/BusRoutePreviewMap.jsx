import { Clock3, MapPin, Route } from "lucide-react";
import MapPicker from "../MapPicker";

export default function BusRoutePreviewMap({
  from,
  to,
  routePoints = [],
  meta = null,
  travelDate = "",
}) {
  const distanceKm = meta?.distanceMeters
    ? (meta.distanceMeters / 1000).toFixed(1)
    : null;

  const etaMinutes = meta?.durationSeconds
    ? Math.round(meta.durationSeconds / 60)
    : null;

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Route Preview</h3>
          <p className="mt-1 text-sm text-white/55">
            Selected bus journey path with distance and ETA.
          </p>
        </div>

        {travelDate ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/70">
            Travel Date: <span className="font-medium text-white">{travelDate}</span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <MapPicker
            pickup={from}
            dropoff={to}
            active="pickup"
            routePoints={routePoints}
            onChangePickup={() => {}}
            onChangeDropoff={() => {}}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-sm text-white/50">
              <MapPin className="h-4 w-4" />
              From
            </div>
            <div className="mt-2 text-base font-medium text-white">
              {from?.label || "Not selected"}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-sm text-white/50">
              <MapPin className="h-4 w-4" />
              To
            </div>
            <div className="mt-2 text-base font-medium text-white">
              {to?.label || "Not selected"}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Route className="h-4 w-4" />
                Distance
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {distanceKm ? `${distanceKm} km` : "--"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Clock3 className="h-4 w-4" />
                ETA
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {etaMinutes ? `${etaMinutes} min` : "--"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}