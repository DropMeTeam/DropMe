import { Clock3 } from "lucide-react";

export default function DayTimetableEditor({ day, rows, onCellChange }) {
  return (
    <section className="space-y-4">
      <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-100">
            <Clock3 className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-white">{day} timetable</h3>
            <p className="mt-1 text-sm text-white/45">
              Edit arrival and departure values for each stop in route order.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/60 md:grid md:grid-cols-[80px_minmax(0,1.4fr)_170px_170px] md:gap-4">
        <div>#</div>
        <div>Station</div>
        <div>Arrival</div>
        <div>Departure</div>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={`${day}-${row.stationId}-${index}`}
            className="grid gap-4 rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,24,36,0.92)_0%,rgba(10,16,25,0.92)_100%)] p-4 md:grid-cols-[80px_minmax(0,1.4fr)_170px_170px] md:items-center"
          >
            <div className="flex items-center gap-3 md:block">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-white/75">
                {index + 1}
              </div>
              <div className="md:hidden">
                <div className="text-xs uppercase tracking-[0.12em] text-white/30">Station</div>
                <div className="mt-1 text-sm font-semibold text-white">{row.stationName}</div>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="text-sm font-semibold text-white">{row.stationName}</div>
              <div className="mt-1 text-xs text-white/35">Stop order {row.order}</div>
            </div>

            <label className="grid gap-2 text-sm text-white/55">
              <span className="md:hidden">Arrival</span>
              <input
                type="time"
                value={row.arrivalTime}
                onChange={(e) => onCellChange(day, index, "arrivalTime", e.target.value)}
                className="h-11 rounded-2xl border border-white/10 bg-[#09101b] px-4 text-sm text-white outline-none transition focus:border-blue-400/45"
              />
            </label>

            <label className="grid gap-2 text-sm text-white/55">
              <span className="md:hidden">Departure</span>
              <input
                type="time"
                value={row.departureTime}
                onChange={(e) => onCellChange(day, index, "departureTime", e.target.value)}
                className="h-11 rounded-2xl border border-white/10 bg-[#09101b] px-4 text-sm text-white outline-none transition focus:border-blue-400/45"
              />
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
