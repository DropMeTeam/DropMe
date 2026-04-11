import { useMemo } from "react";
import { Plus, PlusCircle, Trash2 } from "lucide-react";
import { getLatLng, distanceToSegmentKm, alongFactor } from "../../lib/geo";

function SelectField({ label, value, onChange, options, disabled = false }) {
  return (
    <label className="grid gap-2 text-sm text-white/70">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-12 rounded-2xl border border-white/10 bg-[#09101b] px-4 text-sm text-white outline-none transition focus:border-blue-400/45 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option._id} value={option._id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function RouteBuilder({
  stations,
  startId,
  setStartId,
  endId,
  setEndId,
  stopsOrdered,
  onAddIntermediate,
  onAddStop,
  onRemoveStop,
  onUpdateStopStation,
}) {
  const stationById = useMemo(() => {
    const map = new Map();
    stations.forEach((station) => map.set(String(station._id), station));
    return map;
  }, [stations]);

  const betweenStations = useMemo(() => {
    const A = stationById.get(String(startId));
    const B = stationById.get(String(endId));
    const a = getLatLng(A);
    const b = getLatLng(B);
    if (!a || !b) return [];

    const corridorKm = 3;
    const used = new Set(stopsOrdered.map((stop) => String(stop.stationId)).filter(Boolean));

    const items = [];
    for (const station of stations) {
      const id = String(station._id);
      if (id === String(startId) || id === String(endId)) continue;

      const point = getLatLng(station);
      if (!point) continue;

      const distance = distanceToSegmentKm(point, a, b);
      const along = alongFactor(point, a, b);
      const isBetween = along > 0.02 && along < 0.98 && distance <= corridorKm;

      if (isBetween) items.push({ _id: id, name: station.name, t: along, disabled: used.has(id) });
    }

    items.sort((x, y) => x.t - y.t);
    return items;
  }, [stations, stationById, startId, endId, stopsOrdered]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="Start Station" value={startId} onChange={setStartId} options={stations} />
        <SelectField label="End Station" value={endId} onChange={setEndId} options={stations} />
      </div>

      <section className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">Ordered Stops</h3>
            <p className="mt-1 text-sm text-white/45">Define the station sequence. Start and end remain locked once selected.</p>
          </div>
          <button
            type="button"
            onClick={onAddStop}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]"
          >
            <PlusCircle className="h-4 w-4" />
            Add Stop
          </button>
        </div>

        <div className="space-y-3">
          {stopsOrdered.map((stop, index) => {
            const locked = (index === 0 && !!startId) || (index === stopsOrdered.length - 1 && !!endId);
            return (
              <div
                key={stop.key}
                className="grid gap-3 rounded-2xl border border-white/8 bg-[#0b111c] p-3 md:grid-cols-[40px_minmax(0,1fr)_120px] md:items-center"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-sm font-semibold text-white/65">
                  {index + 1}
                </div>

                <select
                  value={stop.stationId}
                  onChange={(e) => onUpdateStopStation(stop.key, e.target.value)}
                  disabled={locked}
                  className="h-11 rounded-xl border border-white/10 bg-[#09101b] px-4 text-sm text-white outline-none transition focus:border-blue-400/45 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Select station...</option>
                  {stations.map((station) => (
                    <option key={station._id} value={station._id}>
                      {station.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => onRemoveStop(stop.key)}
                  disabled={stopsOrdered.length <= 2 || index === 0 || index === stopsOrdered.length - 1}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-400/14 bg-red-500/8 px-3 text-sm font-medium text-red-100 transition hover:bg-red-500/14 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {!!startId && !!endId && (
        <section className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-white">Suggested Intermediate Stations</h3>
            <p className="mt-1 text-sm text-white/45">Quick-add stations detected along the current A → B corridor.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {betweenStations.slice(0, 12).map((item) => (
              <button
                key={item._id}
                type="button"
                disabled={item.disabled}
                onClick={() => onAddIntermediate(item._id)}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0b111c] px-4 py-3 text-left text-sm text-white/80 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>{item.name}</span>
                <Plus className="h-4 w-4 text-amber-300" />
              </button>
            ))}

            {betweenStations.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-6 text-sm text-white/40 sm:col-span-2">
                No suggested stations found for this route selection yet.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
