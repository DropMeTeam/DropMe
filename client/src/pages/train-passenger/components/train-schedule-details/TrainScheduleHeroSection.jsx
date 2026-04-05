import { CalendarDays, Route, TrainFront, Users } from "lucide-react";
import trainHeroImage from "./assets/train-hero.png";
import TrainScheduleMetricCard from "./TrainScheduleMetricCard";
import TrainScheduleDaySelector from "./TrainScheduleDaySelector";
import { formatDistanceKm } from "./trainScheduleDetails.utils";

export default function TrainScheduleHeroSection({ schedule, activeDay, onDayChange }) {
  return (
    <section className="relative overflow-hidden rounded-[36px] border border-blue-400/10 bg-[#04112b] p-6 shadow-[0_18px_60px_rgba(2,8,23,0.55)] md:p-8">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-95"
        style={{
          backgroundImage: `url(${trainHeroImage})`,
          filter: "saturate(1.22) contrast(1.08) brightness(1.04)",
        }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,11,30,0.42)_0%,rgba(3,11,30,0.24)_38%,rgba(3,11,30,0.14)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.20),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.24),transparent_30%),linear-gradient(180deg,transparent,rgba(2,6,23,0.14))]" />

      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] border border-blue-400/25 bg-[linear-gradient(180deg,rgba(37,99,235,0.22),rgba(15,23,42,0.42))] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-xl">
              <TrainFront className="h-9 w-9 text-[#60a5fa]" />
            </div>

            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.45)] sm:text-4xl md:text-5xl">
                {schedule.trainName || "Unnamed train service"}
              </h1>

              <div className="mt-3 inline-flex rounded-2xl border border-blue-300/35 bg-blue-500/18 px-4 py-1.5 text-sm font-semibold tracking-wide text-blue-50 backdrop-blur-xl">
                {schedule.trainNo || "Train service"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TrainScheduleMetricCard
            icon={Users}
            label="Capacity"
            value={`${schedule.seatCapacity ?? 0} seats`}
            accentClass="text-emerald-400"
          />

          <TrainScheduleMetricCard
            icon={Route}
            label="Distance"
            value={formatDistanceKm(schedule.totalDistanceKm)}
            accentClass="text-violet-400"
          />

          <TrainScheduleMetricCard
            icon={CalendarDays}
            label="Select Day"
            accentClass="text-blue-400"
          >
            <TrainScheduleDaySelector value={activeDay} onChange={onDayChange} />
          </TrainScheduleMetricCard>
        </div>
      </div>
    </section>
  );
}