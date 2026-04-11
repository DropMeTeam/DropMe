import { Search, Trash2 } from "lucide-react";

function TrainCard({ schedule, selected, onSelect, onDelete }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(schedule._id)}
      className={`w-full rounded-[22px] border p-4 text-left transition ${
        selected
          ? "border-blue-400/30 bg-blue-500/10 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.18)]"
          : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-white">
            {schedule.trainNo} {schedule.trainName ? `• ${schedule.trainName}` : ""}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/55">
            <span className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1">
              Seats: {schedule.seatCapacity}
            </span>
            <span className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1">
              Stops: {schedule.stops?.length || 0}
            </span>
            <span className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1">
              {schedule.totalDistanceKm ?? 0} km
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(schedule._id);
          }}
          className="grid h-10 w-10 place-items-center rounded-xl border border-red-300/15 bg-red-500/10 text-red-100 transition hover:bg-red-500/20"
          title="Delete train"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </button>
  );
}

export default function TrainScheduleSearchPanel({
  loading,
  schedules,
  search,
  setSearch,
  selectedId,
  onSelect,
  onDelete,
}) {
  return (
    <aside className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,28,40,0.96)_0%,rgba(10,16,26,0.98)_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Train Search</h2>
          <p className="mt-1 text-sm text-white/45">
            Open an existing schedule to edit route, timetable, and fares.
          </p>
        </div>
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by train no or name"
          className="h-12 w-full rounded-2xl border border-white/10 bg-[#09101b] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-400/45"
        />
      </div>

      <div className="mt-4 timetable-scroll max-h-[900px] space-y-3 overflow-y-auto pr-1">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[108px] animate-pulse rounded-[22px] border border-white/8 bg-white/[0.03]"
            />
          ))
        ) : schedules.length > 0 ? (
          schedules.map((schedule) => (
            <TrainCard
              key={schedule._id}
              schedule={schedule}
              selected={String(selectedId) === String(schedule._id)}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center text-sm text-white/45">
            No train schedules found.
          </div>
        )}
      </div>
    </aside>
  );
}
