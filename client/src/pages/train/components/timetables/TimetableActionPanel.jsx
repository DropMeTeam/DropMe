import { RotateCcw, Save, Trash2 } from "lucide-react";

export default function TimetableActionPanel({
  selected,
  busy,
  activeDay,
  onSave,
  onReset,
  onDelete,
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,28,40,0.96)_0%,rgba(11,17,27,0.96)_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <h3 className="text-lg font-semibold text-white">Actions</h3>
      <p className="mt-1 text-sm text-white/45">
        Save edits for the selected train or remove it completely from the system.
      </p>

      <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
        <div className="text-[11px] uppercase tracking-[0.12em] text-white/35">Current editor</div>
        <div className="mt-2 text-sm font-semibold text-white">
          {selected ? `${activeDay} timetable open` : "No train selected"}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <button
          type="button"
          disabled={!selected || busy}
          onClick={onSave}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(180deg,#2563eb_0%,#1d4ed8_100%)] px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Save className="h-4 w-4" />
          {busy ? "Saving..." : "Save changes"}
        </button>

        <button
          type="button"
          disabled={!selected || busy}
          onClick={onReset}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white/80 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <RotateCcw className="h-4 w-4" />
          Reset editor
        </button>

        <button
          type="button"
          disabled={!selected || busy}
          onClick={onDelete}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 text-sm font-medium text-red-100 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Trash2 className="h-4 w-4" />
          Delete train
        </button>
      </div>
    </section>
  );
}
