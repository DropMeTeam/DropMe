import { Edit3, PlusCircle, Trash2 } from "lucide-react";

export default function ExistingScheduleBar({
  schedules,
  selectedScheduleId,
  setSelectedScheduleId,
  onLoadSelected,
  onDeleteSelected,
  onReset,
  busy,
}) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,25,38,0.96)_0%,rgba(11,17,27,0.96)_100%)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Existing schedule access</h2>
          <p className="mt-1 text-sm text-white/45">
            No route list card here. Load a saved schedule only when you need to edit or delete one.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]"
        >
          <PlusCircle className="h-4 w-4" />
          New schedule
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
        <select
          value={selectedScheduleId}
          onChange={(e) => setSelectedScheduleId(e.target.value)}
          className="h-12 rounded-2xl border border-white/10 bg-[#09101b] px-4 text-sm text-white outline-none transition focus:border-blue-400/50"
        >
          <option value="">Select saved schedule...</option>
          {schedules.map((schedule) => (
            <option key={schedule._id} value={schedule._id}>
              {schedule.trainNo} {schedule.trainName ? `• ${schedule.trainName}` : ""}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={!selectedScheduleId || busy}
          onClick={onLoadSelected}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-500/15 px-4 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/22 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Edit3 className="h-4 w-4" />
          Load
        </button>

        <button
          type="button"
          disabled={!selectedScheduleId || busy}
          onClick={onDeleteSelected}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 text-sm font-semibold text-red-100 transition hover:bg-red-500/16 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </section>
  );
}
