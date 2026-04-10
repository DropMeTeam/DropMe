import overviewImage from "../../../assets/bus-owner/overview.png";
import { api } from "../../../lib/api";

function getImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;

  const baseUrl = api?.defaults?.baseURL || "http://localhost:5000";
  const cleanBase = String(baseUrl).replace(/\/$/, "");

  return `${cleanBase}${url.startsWith("/") ? "" : "/"}${url}`;
}

function shortPlace(label = "") {
  if (!label) return "-";

  if (label.includes(" - ")) {
    const right = label.split(" - ").pop()?.trim();
    if (right) return right;
  }

  return String(label).split(",")[0].trim();
}

function getTodayDayOfWeek() {
  return new Date().getDay(); // Sunday=0, Monday=1 ... Saturday=6
}

function getTodayScheduledBuses(buses = [], schedules = []) {
  const today = getTodayDayOfWeek();

  const todaySchedules = schedules.filter(
    (item) => Number(item?.dayOfWeek) === today
  );

  const seen = new Set();
  const results = [];

  todaySchedules.forEach((schedule) => {
    const busId = schedule?.busId?._id || schedule?.busId;
    if (!busId || seen.has(String(busId))) return;

    const matchedBus =
      buses.find((bus) => String(bus?._id) === String(busId)) || schedule?.busId;

    if (matchedBus) {
      seen.add(String(busId));
      results.push({
        ...matchedBus,
        __schedule: schedule,
      });
    }
  });

  return results.slice(0, 4);
}

function StatCard({ title, value, valueClassName = "text-white" }) {
  return (
    <div className="rounded-[30px] border border-white/10 bg-[#0e1520] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.28)]">
      <p className="text-lg text-zinc-300">{title}</p>
      <h3 className={`mt-4 text-5xl font-bold ${valueClassName}`}>{value}</h3>
    </div>
  );
}

function TodayBusCard({ bus }) {
  const busImage = getImageUrl(bus?.photoUrl);
  const routeNo = bus?.routeId?.routeNumber || "-";
  const start = shortPlace(bus?.routeId?.start?.label);
  const end = shortPlace(bus?.routeId?.end?.label);

  const stops = Array.isArray(bus?.__schedule?.stopTimes) ? bus.__schedule.stopTimes : [];
  const startTime = stops[0]?.time || "--";
  const endTime = stops[stops.length - 1]?.time || "--";

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0f141c] shadow-[0_14px_35px_rgba(0,0,0,0.3)]">
      <div className="relative h-44 w-full overflow-hidden bg-black/30">
        {busImage ? (
          <img
            src={busImage}
            alt={bus?.plateNumber || "Bus"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-500">
            No image
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1017] via-[#0b1017]/20 to-transparent" />

        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
            Bus No
          </p>
          <h3 className="mt-1 text-2xl font-bold text-white">
            {bus?.plateNumber || "-"}
          </h3>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Route No
            </p>
            <p className="mt-1 text-sm font-semibold text-white">{routeNo}</p>
          </div>

          <div className="rounded-2xl bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Time
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {startTime} - {endTime}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
            Route
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {start} → {end}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OverviewSection({
  user,
  buses = [],
  schedules = [],
  onGoToAddBus,
  onGoToSchedules,
}) {
  const approvedCount = buses.filter(
    (bus) => String(bus?.status || "").toLowerCase() === "approved"
  ).length;

  const pendingCount = buses.filter(
    (bus) => String(bus?.status || "").toLowerCase() === "pending"
  ).length;

  const rejectedCount = buses.filter(
    (bus) => String(bus?.status || "").toLowerCase() === "rejected"
  ).length;

  const todayScheduledBuses = getTodayScheduledBuses(buses, schedules);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <img
          src={overviewImage}
          alt="Bus owner overview"
          className="h-[260px] w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#09111d]/90 via-[#09111d]/55 to-[#09111d]/20" />

        <div className="absolute inset-0 flex items-end justify-between gap-4 p-8">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold tracking-tight text-white">
              Welcome back, {user?.name || "bus owner"}
            </h1>
            <p className="mt-3 max-w-xl text-lg text-zinc-200">
              Your fleet workspace is ready. Review today’s operations and manage scheduled buses with confidence.
            </p>
          </div>

          <button
            type="button"
            onClick={onGoToAddBus}
            className="shrink-0 rounded-full bg-emerald-400 px-7 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            + Add New Bus
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Approved Buses"
          value={approvedCount}
          valueClassName="text-emerald-400"
        />
        <StatCard
          title="Pending Buses"
          value={pendingCount}
          valueClassName="text-amber-400"
        />
        <StatCard
          title="Rejected Buses"
          value={rejectedCount}
          valueClassName="text-red-400"
        />
      </div>

      <section className="rounded-[32px] border border-white/10 bg-[#10141b] p-6 shadow-[0_14px_40px_rgba(0,0,0,0.28)]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Today Scheduled Buses</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Maximum 4 buses are displayed for quick operational visibility.
            </p>
          </div>

          <button
            type="button"
            onClick={onGoToSchedules}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            View All
          </button>
        </div>

        {todayScheduledBuses.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {todayScheduledBuses.map((bus) => (
              <TodayBusCard
                key={bus?._id || bus?.plateNumber}
                bus={bus}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-zinc-500">
            No buses scheduled for today.
          </div>
        )}
      </section>
    </div>
  );
}