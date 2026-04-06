import { Activity, Building2, Route } from "lucide-react";

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/75">
      <Icon className="h-4 w-4 text-blue-300" />
      <span className="text-white/45">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

export default function TrainSchedulesHeader({ stationCount, scheduleCount, activeCount }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,28,40,0.96)_0%,rgba(11,17,27,0.96)_100%)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-blue-200/55">Rail control center</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Manage Train Schedules</h1>
          
        </div>

        <div className="flex flex-wrap gap-3">
          <StatPill icon={Building2} label="Stations" value={stationCount} />
          <StatPill icon={Route} label="Schedules" value={scheduleCount} />
          <StatPill icon={Activity} label="Active" value={activeCount} />
        </div>
      </div>
    </section>
  );
}
