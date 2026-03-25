import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TrainFront, Search, CalendarDays, ArrowRightLeft } from "lucide-react";
import api from "../../lib/api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TrainSearchPage() {
  const [stations, setStations] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [day, setDay] = useState("");
  const [loadingStations, setLoadingStations] = useState(true);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadStations() {
      setLoadingStations(true);
      setError("");

      try {
        const res = await api.get("/api/train/stations");
        const rows = Array.isArray(res.data?.stations) ? res.data.stations : [];
        if (mounted) setStations(rows);
      } catch (e) {
        if (mounted) {
          setError(e?.response?.data?.message || "Failed to load stations");
        }
      } finally {
        if (mounted) setLoadingStations(false);
      }
    }

    loadStations();
    return () => {
      mounted = false;
    };
  }, []);

  const canSearch = useMemo(() => {
    return !!from && !!to && from !== to;
  }, [from, to]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!canSearch) return;

    setSearching(true);
    setError("");

    try {
      const res = await api.get("/api/train/search", {
        params: {
          from,
          to,
          ...(day ? { day } : {}),
        },
      });

      setResults(Array.isArray(res.data?.trains) ? res.data.trains : []);
    } catch (e2) {
      setError(e2?.response?.data?.message || "Failed to search trains");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function swapStations() {
    setFrom(to);
    setTo(from);
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-950">
            <TrainFront className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Search trains</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Choose origin, destination, and operating day to view available train services.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-6 grid gap-4 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="mb-2 block text-sm text-zinc-300">From station</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-white/30"
              disabled={loadingStations}
            >
              <option value="">Select origin</option>
              {stations.map((s) => (
                <option key={s._id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-center md:col-span-1">
            <button
              type="button"
              onClick={swapStations}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
              title="Swap stations"
            >
              <ArrowRightLeft className="h-5 w-5" />
            </button>
          </div>

          <div className="md:col-span-4">
            <label className="mb-2 block text-sm text-zinc-300">To station</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-white/30"
              disabled={loadingStations}
            >
              <option value="">Select destination</option>
              {stations.map((s) => (
                <option key={s._id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="mb-2 block text-sm text-zinc-300">Day</label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-10 pr-4 text-white outline-none focus:border-white/30"
              >
                <option value="">Any / base schedule</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-12">
            <button
              type="submit"
              disabled={!canSearch || searching}
              className="inline-flex items-center rounded-2xl bg-white px-5 py-3 font-medium text-zinc-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search className="mr-2 h-4 w-4" />
              {searching ? "Searching..." : "Search trains"}
            </button>
          </div>
        </form>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4">
        {results.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-6 text-sm text-zinc-400">
            No train results yet. Search to see matching services.
          </div>
        ) : null}

        {results.map((train) => (
          <article
            key={train._id}
            className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-6"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  {train.trainNo}
                </div>
                <h2 className="mt-1 text-xl font-semibold">
                  {train.trainName || "Unnamed train service"}
                </h2>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-400">
                  <span>Capacity: {train.seatCapacity}</span>
                  <span>Distance: {train.totalDistanceKm ?? 0} km</span>
                  <span>
                    Duration: {train.durationLabel || `${train.durationMinutes ?? 0} mins`}
                  </span>
                </div>
              </div>

              <div className="text-sm text-zinc-300">
                {day ? <div className="mb-1">Day: {day}</div> : null}
                <Link
                  to={`/train-service/${train._id}${day ? `?day=${day}` : ""}`}
                  className="inline-flex items-center rounded-2xl border border-zinc-700 px-4 py-2 hover:bg-zinc-900"
                >
                  View schedule
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                <div className="text-xs text-zinc-500">From</div>
                <div className="mt-1 font-medium">{train.from?.station?.name}</div>
                <div className="mt-1 text-sm text-zinc-400">
                  Departure: {train.from?.departureTime || "-"}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                <div className="text-xs text-zinc-500">To</div>
                <div className="mt-1 font-medium">{train.to?.station?.name}</div>
                <div className="mt-1 text-sm text-zinc-400">
                  Arrival: {train.to?.arrivalTime || "-"}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                <div className="text-xs text-zinc-500">Stops in journey</div>
                <div className="mt-1 font-medium">{train.stopsBetween?.length || 0}</div>
                <div className="mt-1 text-sm text-zinc-400">
                  Includes origin and destination
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}