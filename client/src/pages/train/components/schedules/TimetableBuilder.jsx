import { useEffect, useMemo, useState } from "react";
import { Clock3, TimerReset } from "lucide-react";
import { minutesFromHHMM, hhmmFromMinutes } from "../../lib/time";

export default function TimetableBuilder({ stopsOrdered, segments, defaultDwell = 20, onGeneratedTimesChange }) {
  const [startHHMM, setStartHHMM] = useState("09:00");
  const [dwellMin, setDwellMin] = useState(defaultDwell);
  const [rows, setRows] = useState([]);

  const names = useMemo(() => stopsOrdered.map((stop) => stop.station?.name || "—"), [stopsOrdered]);

  function build(baseStartMinutes, dwell) {
    if (!stopsOrdered.length) return [];

    if (!segments || segments.length !== stopsOrdered.length - 1) {
      return stopsOrdered.map((_, index) => ({
        idx: index,
        name: names[index],
        arrival: "",
        departure: index === 0 ? hhmmFromMinutes(baseStartMinutes) : "",
      }));
    }

    let departureCursor = baseStartMinutes;
    const output = [];

    for (let i = 0; i < stopsOrdered.length; i += 1) {
      if (i === 0) {
        output.push({ idx: i, name: names[i], arrival: "", departure: hhmmFromMinutes(departureCursor) });
        continue;
      }

      const seg = segments[i - 1];
      const arrival = departureCursor + (seg?.durationMin || 0);
      const isLast = i === stopsOrdered.length - 1;

      if (isLast) {
        output.push({ idx: i, name: names[i], arrival: hhmmFromMinutes(arrival), departure: hhmmFromMinutes(arrival) });
        departureCursor = arrival;
      } else {
        const nextDeparture = arrival + dwell;
        output.push({ idx: i, name: names[i], arrival: hhmmFromMinutes(arrival), departure: hhmmFromMinutes(nextDeparture) });
        departureCursor = nextDeparture;
      }
    }

    return output;
  }

  useEffect(() => {
    const base = minutesFromHHMM(startHHMM);
    if (base == null) return;

    const builtRows = build(base, Number(dwellMin) || 0);
    setRows(builtRows);

    const generatedStops = stopsOrdered.map((stop, index) => {
      const arrival = builtRows[index]?.arrival || "";
      let departure = builtRows[index]?.departure || "";
      if (index === stopsOrdered.length - 1) departure = departure || arrival;

      return {
        stationId: stop.stationId,
        order: stop.order,
        arrivalTime: arrival,
        departureTime: departure,
      };
    });

    onGeneratedTimesChange?.(generatedStops);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startHHMM, dwellMin, segments, stopsOrdered.map((stop) => stop.stationId).join("|")]);

  function editDeparture(rowIdx, newHHMM) {
    const newMinutes = minutesFromHHMM(newHHMM);
    if (newMinutes == null) return;
    if (!segments || segments.length !== stopsOrdered.length - 1) return;

    setRows((prev) => {
      const next = prev.map((item) => ({ ...item }));
      next[rowIdx].departure = hhmmFromMinutes(newMinutes);

      let departureCursor = newMinutes;

      for (let i = rowIdx + 1; i < stopsOrdered.length; i += 1) {
        const seg = segments[i - 1];
        const arrival = departureCursor + (seg?.durationMin || 0);
        const isLast = i === stopsOrdered.length - 1;

        next[i].arrival = hhmmFromMinutes(arrival);

        if (isLast) {
          next[i].departure = hhmmFromMinutes(arrival);
          departureCursor = arrival;
        } else {
          const departure = arrival + (Number(dwellMin) || 0);
          next[i].departure = hhmmFromMinutes(departure);
          departureCursor = departure;
        }
      }

      const generatedStops = stopsOrdered.map((stop, index) => {
        const arrival = next[index]?.arrival || "";
        let departure = next[index]?.departure || "";
        if (index === stopsOrdered.length - 1) departure = departure || arrival;

        return {
          stationId: stop.stationId,
          order: stop.order,
          arrivalTime: arrival,
          departureTime: departure,
        };
      });

      onGeneratedTimesChange?.(generatedStops);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">Timetable Workspace</h3>
            
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-white/50">
            Railway schedule board
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-white/70">
            <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-blue-200" /> Start Time at A</span>
            <input
              type="time"
              value={startHHMM}
              onChange={(e) => setStartHHMM(e.target.value)}
              className="h-12 rounded-2xl border border-white/10 bg-[#09101b] px-4 text-sm text-white outline-none transition focus:border-blue-400/45"
            />
          </label>

          <label className="grid gap-2 text-sm text-white/70">
            <span className="flex items-center gap-2"><TimerReset className="h-4 w-4 text-blue-200" /> Dwell / Stop Minutes</span>
            <input
              type="number"
              min={0}
              value={dwellMin}
              onChange={(e) => setDwellMin(e.target.value)}
              className="h-12 rounded-2xl border border-white/10 bg-[#09101b] px-4 text-sm text-white outline-none transition focus:border-blue-400/45"
            />
          </label>
        </div>
      </section>

      <section className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,17,26,0.96)_0%,rgba(7,12,20,0.96)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="grid grid-cols-[72px_minmax(0,1.3fr)_0.8fr_0.9fr] gap-3 border-b border-white/10 pb-3 text-xs uppercase tracking-[0.16em] text-white/40">
          <div>Stop</div>
          <div>Station</div>
          <div>Arrival</div>
          <div>Departure</div>
        </div>

        <div className="mt-3 space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.idx}
              className="grid grid-cols-[72px_minmax(0,1.3fr)_0.8fr_0.9fr] gap-3 rounded-2xl border border-white/8 bg-[#0b111c] p-3"
            >
              <div className="flex items-center">
                <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white/75">
                  {index + 1}
                </span>
              </div>

              <div className="flex min-w-0 items-center">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">{row.name}</div>
                  <div className="mt-1 text-xs text-white/35">Linked stop in generated route order</div>
                </div>
              </div>

              <div className="flex items-center text-sm text-white/80">
                {index === 0 ? <span className="text-white/30">—</span> : row.arrival}
              </div>

              <div className="flex items-center">
                {index === rows.length - 1 ? (
                  <span className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/35">Locked</span>
                ) : (
                  <input
                    type="time"
                    value={row.departure}
                    onChange={(e) => editDeparture(index, e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#09101b] px-3 text-sm text-white outline-none transition focus:border-blue-400/45"
                  />
                )}
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-sm text-white/40">
              Build a route first to open the timetable workspace.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
