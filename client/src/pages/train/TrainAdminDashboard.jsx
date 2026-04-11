import { Link } from "react-router-dom";
import {
  TrainFront,
  MapPinned,
  CalendarPlus2,
  CalendarCog,
  TicketCheck,
  ArrowRight,
} from "lucide-react";

import stationsImg from "../../assets/train-admin/stations.png";
import createScheduleImg from "../../assets/train-admin/create-schedule.png";
import manageSchedulesImg from "../../assets/train-admin/manage-schedules.png";
import verifyTicketImg from "../../assets/train-admin/verify-ticket.png";

const stats = [
  { label: "Stations", value: "145" },
  { label: "Active Routes", value: "28" },
  { label: "Schedules Today", value: "320" },
  { label: "Ticket Scans", value: "15,200" },
];

const modules = [
  {
    title: "Stations",
    description:
      "Manage railway stations, platforms, and mapping.",
    cta: "Manage Now",
    to: "/train/stations",
    icon: MapPinned,
    image: stationsImg,
    iconTone:
      "text-sky-100 bg-sky-500/15 border-sky-300/25 shadow-[0_10px_30px_rgba(56,189,248,0.18)]",
    glow: "from-sky-500/20 via-sky-400/5 to-transparent",
  },
  {
    title: "Create Schedule",
    description:
      "Build new train routes, define  schedules, and link stations.",
    cta: "Open Builder",
    to: "/train/schedules",
    icon: CalendarPlus2,
    image: createScheduleImg,
    iconTone:
      "text-blue-100 bg-blue-500/15 border-blue-300/25 shadow-[0_10px_30px_rgba(59,130,246,0.18)]",
    glow: "from-blue-500/20 via-blue-400/5 to-transparent",
  },
  {
    title: "Manage Schedules",
    description:
      "Edit, search, update, and delete existing train schedules and timetables.",
    cta: "Manage Now",
    to: "/train/timetables",
    icon: CalendarCog,
    image: manageSchedulesImg,
    iconTone:
      "text-indigo-100 bg-indigo-500/15 border-indigo-300/25 shadow-[0_10px_30px_rgba(99,102,241,0.18)]",
    glow: "from-indigo-500/20 via-indigo-400/5 to-transparent",
  },
  {
    title: "Verify Ticket",
    description:
      "Verify ticket QR codes, booking status, and passenger information.",
    cta: "Open Scanner",
    to: "/train/ticket-verify",
    icon: TicketCheck,
    image: verifyTicketImg,
    iconTone:
      "text-cyan-100 bg-cyan-500/15 border-cyan-300/25 shadow-[0_10px_30px_rgba(34,211,238,0.18)]",
    glow: "from-cyan-500/20 via-cyan-400/5 to-transparent",
  },
];

function StatPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">{label}:</span>
        <span className="text-sm text-white/80">{value}</span>
      </div>
    </div>
  );
}

function DashboardCard({ item }) {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      className="group relative min-h-[228px] overflow-hidden rounded-[30px] border border-white/10 bg-[#0b1320] shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-blue-300/20 hover:shadow-[0_28px_70px_rgba(37,99,235,0.14)]"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${item.glow} opacity-35`} />

      <img
        src={item.image}
        alt={item.title}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,20,0.01)_0%,rgba(4,10,20,0.05)_45%,rgba(4,10,20,0.14)_100%)]" />

      <div className="absolute right-5 top-5">
        <div
          className={[
            "inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-[2px] transition duration-300 group-hover:scale-105",
            item.iconTone,
          ].join(" ")}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="absolute left-5 bottom-5">
        <div className="w-[58%] max-w-[520px] rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.18)_0%,rgba(15,23,42,0.26)_100%)] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.12)] backdrop-blur-[2px]">
          <h3 className="text-[1.9rem] font-bold leading-tight tracking-[-0.02em] text-white">
            {item.title}
          </h3>

          <p className="mt-2 text-base leading-7 text-white/88">
            {item.description}
          </p>

          <div className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-base font-semibold text-white transition group-hover:border-blue-300/25 group-hover:bg-blue-500/10">
            <span>{item.cta}</span>
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TrainAdminDashboard() {
  return (
    <div className="relative overflow-hidden px-4 py-5 text-white sm:px-5 lg:px-6">
      <div className="pointer-events-none absolute left-[-140px] top-[-120px] h-[320px] w-[320px] rounded-full bg-blue-500/12 blur-3xl" />
      <div className="pointer-events-none absolute right-[-120px] top-[40px] h-[280px] w-[280px] rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-120px] left-[25%] h-[260px] w-[260px] rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-[1720px] space-y-8">
        <section className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
              <TrainFront className="h-7 w-7 text-blue-200" />
            </div>

            <div className="min-w-0">
              <h1 className="text-4xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
                Train Admin Dashboard
              </h1>
              <p className="mt-3 max-w-4xl text-lg leading-8 text-white/65">
                Operational control panel for station management, routing,
                schedules, and ticket verification.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {stats.map((stat) => (
              <StatPill key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200/80">
                Quick Access
              </p>
              <h2 className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-white">
                Core Railway Modules
              </h2>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {modules.map((item) => (
              <DashboardCard key={item.title} item={item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}