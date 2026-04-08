import { Bell, TrainFront } from "lucide-react";

export default function StationSidebarHeader() {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/6 pb-3">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] shadow-[0_10px_30px_rgba(37,99,235,0.35)]">
          <TrainFront className="h-4 w-4 text-white" />
        </div>

        <div>
          <div className="text-[15px] font-semibold tracking-wide text-white">TransitAdmin</div>
          <div className="text-[11px] text-white/40">Station control center</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/8 bg-white/[0.03] text-white/75 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        <div className="grid h-9 w-9 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#8b5cf6_0%,#3b82f6_45%,#111827_100%)] text-xs font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.25)]">
          TA
        </div>
      </div>
    </div>
  );
}
