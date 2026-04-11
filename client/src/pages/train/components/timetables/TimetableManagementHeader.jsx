import { CalendarClock, Route, TrainFront } from "lucide-react";

function StatChip({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/35">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

export default function TimetableManagementHeader({
  totalSchedules,
  totalStations,
  selectedTrainNo,
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,28,40,0.96)_0%,rgba(11,17,27,0.96)_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-blue-100">
            <CalendarClock className="h-3.5 w-3.5" />
            Train management workspace
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-white lg:text-[30px]">
            Manage Train Routes & Timetables
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
            Search a train, load it into the editor, update route details, adjust weekday timetable rows,
            tune fares, and delete outdated schedules from one control center.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[560px]">
          <StatChip icon={TrainFront} label="Schedules" value={totalSchedules} />
          <StatChip icon={Route} label="Stations" value={totalStations} />
          <StatChip icon={CalendarClock} label="Selected" value={selectedTrainNo || "None"} />
        </div>
      </div>
    </section>
  );
}