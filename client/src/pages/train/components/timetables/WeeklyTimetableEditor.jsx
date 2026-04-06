export default function WeeklyTimetableEditor({
  days,
  activeDay,
  setActiveDay,
  week,
  setCell,
}) {
  const rows = week[activeDay] || [];

  return (
    <section className="space-y-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <div>
        <h3 className="text-lg font-semibold text-white">Weekly Timetable</h3>
        <p className="mt-1 text-sm text-white/45">
          Update day-wise arrival and departure times for the loaded route.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {days.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setActiveDay(day)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeDay === day
                ? "bg-blue-500/20 text-blue-100 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.35)]"
                : "border border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
        <div className="grid grid-cols-[1.4fr_0.7fr_0.7fr] gap-3 border-b border-white/10 pb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/35">
          <div>Station</div>
          <div>Arrival</div>
          <div>Departure</div>
        </div>

        <div className="mt-3 space-y-3">
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <div
                key={`${activeDay}-${row.stationId}-${index}`}
                className="grid grid-cols-[1.4fr_0.7fr_0.7fr] gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">
                    {index + 1}. {row.stationName}
                  </div>
                  <div className="mt-1 text-xs text-white/35">{activeDay} service timing</div>
                </div>

                <input
                  type="time"
                  value={row.arrivalTime}
                  onChange={(e) => setCell(activeDay, index, "arrivalTime", e.target.value)}
                  className="h-11 rounded-xl border border-white/10 bg-[#09101b] px-3 text-sm text-white outline-none transition focus:border-blue-400/45"
                />

                <input
                  type="time"
                  value={row.departureTime}
                  onChange={(e) => setCell(activeDay, index, "departureTime", e.target.value)}
                  className="h-11 rounded-xl border border-white/10 bg-[#09101b] px-3 text-sm text-white outline-none transition focus:border-blue-400/45"
                />
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center text-sm text-white/45">
              Load a train and build a route first, then manage weekday rows here.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}