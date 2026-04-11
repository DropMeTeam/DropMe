import { Save, XCircle } from "lucide-react";

export default function ScheduleActionBar({ busy, onSave, onReset }) {
  return (
    <section className="space-y-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-base font-semibold text-white">Schedule Actions</h3>
      

      <div className="grid gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={onSave}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(180deg,#2563eb_0%,#1d4ed8_100%)] px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Save className="h-4 w-4" />
          {busy ? "Saving..." : "Create Route"}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]"
        >
          <XCircle className="h-4 w-4" />
          Reset Form
        </button>
      </div>
    </section>
  );
}