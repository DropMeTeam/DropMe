import { PencilLine, Trash2 } from "lucide-react";

export default function TrainListCard({
  schedule,
  selected,
  onSelect,
  onDelete,
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[24px] border p-4 text-left transition ${
        selected
          ? "border-blue-400/35 bg-blue-500/10 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.2)]"
          : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold text-white">{schedule.trainNo}</div>
            {schedule.trainName ? (
              <div className="truncate text-sm text-white/55">• {schedule.trainName}</div>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-white/55">
              Seats {schedule.seatCapacity}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-white/55">
              Stops {schedule.stops?.length || 0}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-white/55">
              {schedule.totalDistanceKm ?? 0} km
            </span>
            <span
              className={`rounded-full px-2.5 py-1 ${
                schedule.active
                  ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                  : "border border-white/10 bg-white/[0.03] text-white/50"
              }`}
            >
              {schedule.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <span className="rounded-2xl border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-white/45">
          {selected ? "Opened" : "Open"}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <span className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-white/80">
          <PencilLine className="h-4 w-4" />
          Edit
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-3 text-sm font-medium text-red-100 transition hover:bg-red-500/15"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </button>
  );
}
