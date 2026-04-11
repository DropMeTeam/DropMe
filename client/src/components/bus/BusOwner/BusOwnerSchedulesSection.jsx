import { useMemo, useState } from "react";
import { api } from "../../../lib/api";
import {
  BusFront,
  Clock3,
  Route as RouteIcon,
  MapPin,
  CalendarDays,
  ArrowLeft,
} from "lucide-react";

const DAYS = [
  { key: "monday", label: "Monday", index: 1 },
  { key: "tuesday", label: "Tuesday", index: 2 },
  { key: "wednesday", label: "Wednesday", index: 3 },
  { key: "thursday", label: "Thursday", index: 4 },
  { key: "friday", label: "Friday", index: 5 },
  { key: "saturday", label: "Saturday", index: 6 },
  { key: "sunday", label: "Sunday", index: 0 },
];

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

function formatTime(value) {
  if (!value) return "--";
  return value;
}

function getBusSchedulesForDay(schedules = [], selectedBus, dayIndex) {
  const selectedBusId = String(selectedBus?._id || "");

  return schedules.filter((item) => {
    const itemBusId =
      item?.busId?._id ||
      item?.busId ||
      item?.bus?._id ||
      item?.bus ||
      "";

    const itemDay = Number(item?.dayOfWeek);

    return String(itemBusId) === selectedBusId && itemDay === Number(dayIndex);
  });
}

function getStopsFromSchedule(schedule) {
  if (Array.isArray(schedule?.stopTimes) && schedule.stopTimes.length > 0) {
    return schedule.stopTimes;
  }

  if (Array.isArray(schedule?.stops) && schedule.stops.length > 0) {
    return schedule.stops;
  }

  if (Array.isArray(schedule?.timeTable) && schedule.timeTable.length > 0) {
    return schedule.timeTable;
  }

  return [];
}

function getRouteTextFromStops(schedule, selectedBus) {
  const stops = getStopsFromSchedule(schedule);

  if (stops.length >= 2) {
    const first = shortPlace(stops[0]?.label);
    const last = shortPlace(stops[stops.length - 1]?.label);
    return `${first} → ${last}`;
  }

  const start = shortPlace(selectedBus?.routeId?.start?.label);
  const end = shortPlace(selectedBus?.routeId?.end?.label);
  return `${start} → ${end}`;
}

function getTimeRange(schedule) {
  const stops = getStopsFromSchedule(schedule);

  if (stops.length >= 2) {
    return {
      startTime: stops[0]?.time || "--",
      endTime: stops[stops.length - 1]?.time || "--",
    };
  }

  return {
    startTime: schedule?.startTime || schedule?.departureTime || "--",
    endTime: schedule?.endTime || schedule?.arrivalTime || "--",
  };
}

function BusCard({ bus, onClick }) {
  const image = getImageUrl(bus?.photoUrl);
  const routeNo = bus?.routeId?.routeNumber || "-";
  const start = shortPlace(bus?.routeId?.start?.label);
  const end = shortPlace(bus?.routeId?.end?.label);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-[26px] border border-white/10 bg-[#0f141c] text-left transition hover:border-white/20 hover:bg-[#131922] hover:shadow-[0_16px_40px_rgba(0,0,0,0.38)]"
    >
      <div className="relative h-44 w-full overflow-hidden bg-black/30">
        {image ? (
          <img
            src={image}
            alt={bus?.plateNumber || "Bus"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            <BusFront className="h-10 w-10" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1017] via-[#0b1017]/30 to-transparent" />

        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-400">
            Bus No
          </p>
          <h3 className="mt-1 text-xl font-bold text-white">
            {bus?.plateNumber || "-"}
          </h3>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">
              Route No
            </p>
            <p className="mt-1 text-sm font-semibold text-white">{routeNo}</p>
          </div>

          <div className="rounded-2xl bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">
              Route
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {start} → {end}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

function SelectedBusPreview({ bus }) {
  const image = getImageUrl(bus?.photoUrl);
  const routeNo = bus?.routeId?.routeNumber || "-";
  const start = shortPlace(bus?.routeId?.start?.label);
  const end = shortPlace(bus?.routeId?.end?.label);
  const features = Array.isArray(bus?.features) ? bus.features : [];

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#10161f] shadow-[0_16px_50px_rgba(0,0,0,0.35)]">
      <div className="relative h-56 w-full overflow-hidden bg-black/30">
        {image ? (
          <img
            src={image}
            alt={bus?.plateNumber || "Bus"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            <BusFront className="h-12 w-12" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1017] via-[#0b1017]/35 to-transparent" />

        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">
            Selected Bus
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {bus?.plateNumber || "-"}
          </h2>
        </div>
      </div>

      <div className="grid gap-4 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InfoBox label="Route No" value={routeNo} />
          <InfoBox label="Route" value={`${start} → ${end}`} />
          <InfoBox label="Seats" value={bus?.seatsTotal || "-"} />
        </div>

        <div className="rounded-2xl bg-white/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
            Features
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {features.length > 0 ? (
              features.map((feature, index) => (
                <span
                  key={`${feature}-${index}`}
                  className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200"
                >
                  {feature}
                </span>
              ))
            ) : (
              <span className="text-sm text-zinc-500">No features added</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function WeeklyTimeTable({
  selectedBus,
  schedules,
  selectedScheduleId,
  onSelectSchedule,
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#10161f] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.35)]">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Weekly Timetable</h3>
          <p className="text-sm text-zinc-400">
            Monday to Sunday schedules for {selectedBus?.plateNumber || "-"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DAYS.map((day) => {
          const daySchedules = getBusSchedulesForDay(
            schedules,
            selectedBus,
            day.index
          );

          return (
            <div
              key={day.key}
              className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">{day.label}</h4>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400">
                  {daySchedules.length}
                </span>
              </div>

              {daySchedules.length > 0 ? (
                <div className="space-y-3">
                  {daySchedules.map((item, index) => {
                    const id = item?._id || `${day.key}-${index}`;
                    const routeText = getRouteTextFromStops(item, selectedBus);
                    const { startTime, endTime } = getTimeRange(item);
                    const active = String(selectedScheduleId) === String(id);

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onSelectSchedule(item)}
                        className={`w-full rounded-2xl border p-3 text-left transition ${
                          active
                            ? "border-emerald-400/30 bg-emerald-500/10"
                            : "border-white/10 bg-[#0d131b] hover:border-white/20 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm font-medium text-white">
                          <RouteIcon className="h-4 w-4 text-emerald-300" />
                          <span>{routeText}</span>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
                          <Clock3 className="h-4 w-4" />
                          <span>{formatTime(startTime)}</span>
                          <span className="text-zinc-600">-</span>
                          <span>{formatTime(endTime)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-500">
                  No schedule for this day
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StopsTimeline({ schedule }) {
  if (!schedule) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-zinc-500">
        Click a timetable item to view all bus stops and times.
      </div>
    );
  }

  const stops = getStopsFromSchedule(schedule);

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#10161f] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.35)]">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-white">Stops & Times</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Detailed stop list for the selected schedule
        </p>
      </div>

      {stops.length > 0 ? (
        <div className="space-y-4">
          {stops.map((stop, index) => {
            const label =
              stop?.label ||
              stop?.name ||
              stop?.stopName ||
              stop?.stationName ||
              "-";

            const time =
              stop?.time ||
              stop?.arrivalTime ||
              stop?.departureTime ||
              "--";

            return (
              <div key={`${label}-${index}`} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="mt-1 h-3 w-3 rounded-full bg-emerald-400" />
                  {index !== stops.length - 1 ? (
                    <div className="mt-2 h-full min-h-[38px] w-px bg-white/10" />
                  ) : null}
                </div>

                <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-white">
                      <MapPin className="h-4 w-4 text-emerald-300" />
                      <span className="font-medium">{shortPlace(label)}</span>
                    </div>

                    <div className="rounded-xl bg-white/5 px-3 py-1 text-sm text-zinc-300">
                      {formatTime(time)}
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-zinc-500">{label}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-500">
          No stop details found for this schedule.
        </div>
      )}
    </div>
  );
}

export default function BusOwnerSchedulesSection({
  buses = [],
  schedules = [],
}) {
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const selectedBus = useMemo(() => {
    return buses.find((bus) => String(bus?._id) === String(selectedBusId)) || null;
  }, [buses, selectedBusId]);

  function handleSelectBus(bus) {
    setSelectedBusId(bus?._id || null);
    setSelectedSchedule(null);
  }

  function handleBackToBusList() {
    setSelectedBusId(null);
    setSelectedSchedule(null);
  }

  function handleSelectSchedule(schedule) {
    setSelectedSchedule(schedule);
  }

  return (
    <section className="mt-6 space-y-6">
      {!selectedBus ? (
        <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#11161f_0%,#0b1017_100%)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Schedules</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Select a bus to view its weekly timetable and stop-by-stop times.
              </p>
            </div>

            <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-xs font-medium text-sky-200">
              Weekly schedule management
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {buses.map((bus) => (
              <BusCard
                key={bus._id}
                bus={bus}
                onClick={() => handleSelectBus(bus)}
              />
            ))}
          </div>

          {buses.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-zinc-500">
              No buses available to schedule.
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {selectedBus?.plateNumber || "-"} Schedule View
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Review timetable and stop times for the selected bus.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBackToBusList}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>

          <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <SelectedBusPreview bus={selectedBus} />

            <WeeklyTimeTable
              selectedBus={selectedBus}
              schedules={schedules}
              selectedScheduleId={selectedSchedule?._id}
              onSelectSchedule={handleSelectSchedule}
            />
          </div>

          <StopsTimeline schedule={selectedSchedule} />
        </>
      )}
    </section>
  );
}