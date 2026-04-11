import { RotateCcw, Save, Trash2 } from "lucide-react";

export default function ManageScheduleActionPanel({
  busy,
  hasSelection,
  onSave,
  onReset,
  onDelete,
}) {
  return (
    <section className="space-y-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-base font-semibold text-white">Actions</h3>
      <p className="text-sm text-white/45">
        Save route and timetable changes, reload the selected train state, or delete the schedule.
      </p>

      <div className="grid gap-3">
        <button
          type="button"
          disabled={busy || !hasSelection}
          onClick={onSave}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(180deg,#2563eb_0%,#1d4ed8_100%)] px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Save className="h-4 w-4" />
          {busy ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          disabled={!hasSelection}
          onClick={onReset}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white/80 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <RotateCcw className="h-4 w-4" />
          Revert Loaded Train
        </button>

        <button
          type="button"
          disabled={busy || !hasSelection}
          onClick={onDelete}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-300/15 bg-red-500/10 px-5 text-sm font-medium text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Trash2 className="h-4 w-4" />
          Delete Train
        </button>
      </div>
    </section>
  );
}
