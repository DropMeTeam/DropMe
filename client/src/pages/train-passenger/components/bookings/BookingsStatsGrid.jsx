import { Globe2, Ticket, TrainFront } from "lucide-react";

function StatCard({ icon: Icon, label, value, accentClass }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(22,24,30,0.96),rgba(14,16,22,0.96))] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.20)]">
      <div className="flex items-center gap-4">
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            {label}
          </div>
          <div className="mt-1 text-3xl font-bold tracking-tight text-white">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingsStatsGrid({ totalJourneys, activeTickets, milesTravelled }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <StatCard
        icon={TrainFront}
        label="Total Journeys"
        value={totalJourneys}
        accentClass="text-blue-300"
      />
      <StatCard
        icon={Ticket}
        label="Active Tickets"
        value={activeTickets}
        accentClass="text-emerald-300"
      />
      <StatCard
        icon={Globe2}
        label="Miles Traveled"
        value={milesTravelled.toLocaleString()}
        accentClass="text-violet-300"
      />
    </section>
  );
}
