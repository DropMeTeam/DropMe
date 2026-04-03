import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, TrainFront, CalendarDays } from "lucide-react";
import api from "../../lib/api";

export default function TrainScheduleDetailsPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const day = searchParams.get("day") || "";

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDetails() {
      setLoading(true);
      setError("");

      try {
        const res = await api.get(`/api/train/schedules/${id}`, {
          params: day ? { day } : {},
        });

        if (mounted) {
          setSchedule(res.data?.schedule || null);
        }
      } catch (e) {
        if (mounted) {
          setError(e?.response?.data?.message || "Failed to load schedule");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDetails();
    return () => {
      mounted = false;
    };
  }, [id, day]);

  if (loading) {
    return <div className="p-6 text-sm text-zinc-400">Loading train schedule...</div>;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
        {error}
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-6 text-zinc-400">
        Schedule not found.
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
  <Link
    to="/train-service"
    className="inline-flex items-center rounded-2xl border border-zinc-800 px-4 py-2 hover:bg-zinc-900"
  >
    <ChevronLeft className="mr-2 h-4 w-4" />
    Back to search
  </Link>

  <div className="flex flex-wrap gap-3">
    <Link
      to={`/train-service/${id}/book${day ? `?day=${day}` : ""}`}
      className="inline-flex items-center rounded-2xl bg-white px-4 py-2 font-medium text-zinc-950 hover:opacity-90"
    >
      Book now
    </Link>

    <Link
      to="/train-service/bookings"
      className="inline-flex items-center rounded-2xl border border-zinc-800 px-4 py-2 hover:bg-zinc-900"
    >
      My bookings
    </Link>
  </div>
</div>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-950">
              <TrainFront className="h-6 w-6" />
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                {schedule.trainNo}
              </div>
              <h1 className="mt-1 text-2xl font-semibold">
                {schedule.trainName || "Unnamed train service"}
              </h1>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-400">
                <span>Capacity: {schedule.seatCapacity}</span>
                <span>Distance: {schedule.totalDistanceKm ?? 0} km</span>
                {schedule.selectedDay ? (
                  <span className="inline-flex items-center">
                    <CalendarDays className="mr-1 h-4 w-4" />
                    {schedule.selectedDay}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Booking flow is the next phase.
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-6">
        <h2 className="text-lg font-semibold">Stops</h2>

        <div className="mt-5 grid gap-3">
          {schedule.stops?.map((stop) => (
            <div
              key={`${stop.order}-${stop.station?._id || stop.station?.name || "x"}`}
              className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 md:grid-cols-12"
            >
              <div className="md:col-span-1 text-sm text-zinc-500">#{stop.order}</div>

              <div className="md:col-span-5">
                <div className="font-medium">{stop.station?.name || "Unknown station"}</div>
                <div className="text-sm text-zinc-500">
                  {stop.station?.location
                    ? `${stop.station.location.lat}, ${stop.station.location.lng}`
                    : "No location"}
                </div>
              </div>

              <div className="md:col-span-3 text-sm">
                <div className="text-zinc-500">Arrival</div>
                <div>{stop.arrivalTime || "-"}</div>
              </div>

              <div className="md:col-span-3 text-sm">
                <div className="text-zinc-500">Departure</div>
                <div>{stop.departureTime || "-"}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}