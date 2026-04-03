import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrainFront,
  Search,
  CalendarDays,
  MapPin,
  LocateFixed,
  ArrowRightLeft,
  Navigation
} from "lucide-react";

import api from "../../lib/api";
import RouteMap from "../../components/RouteMap";
import { getRoute } from "../../lib/osrm";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TrainSearchPage() {
  const [stations, setStations] = useState([]);

  const [destinationStationId, setDestinationStationId] = useState("");
  const [day, setDay] = useState("");

  const [currentLocation, setCurrentLocation] = useState(null); // { label, lat, lng }
  const [nearestStations, setNearestStations] = useState([]);
  const [results, setResults] = useState([]);

  const [selectedTrain, setSelectedTrain] = useState(null);

  const [routePoints, setRoutePoints] = useState([]);
  const [accessRouteMeta, setAccessRouteMeta] = useState(null);

  const [loadingStations, setLoadingStations] = useState(true);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [routing, setRouting] = useState(false);
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

  const destinationStation = useMemo(() => {
    return stations.find((s) => s._id === destinationStationId) || null;
  }, [stations, destinationStationId]);

  const canSearch = useMemo(() => {
    return (
      !!currentLocation?.lat &&
      !!currentLocation?.lng &&
      !!destinationStationId
    );
  }, [currentLocation, destinationStationId]);

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCurrentLocation({
          label: "My current location",
          lat,
          lng,
        });

        try {
          const res = await api.get("/api/train/nearest-stations", {
            params: { lat, lng, limit: 5 },
          });

          setNearestStations(
            Array.isArray(res.data?.stations) ? res.data.stations : []
          );
        } catch (e) {
          setError(e?.response?.data?.message || "Failed to load nearest stations");
          setNearestStations([]);
        } finally {
          setLocating(false);
        }
      },
      (geoError) => {
        setLocating(false);

        if (geoError.code === 1) {
          setError("Location permission denied. Please allow location access.");
        } else {
          setError("Failed to get your current location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  function swapDestinationWithNearest() {
    if (!nearestStations.length) return;

    const nearest = nearestStations[0];
    const currentDestination = stations.find((s) => s._id === destinationStationId);

    if (!nearest || !currentDestination) return;

    const nearestMatch = stations.find((s) => String(s._id) === String(nearest._id));
    if (!nearestMatch) return;

    setDestinationStationId(nearestMatch._id);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!canSearch) return;

    setSearching(true);
    setError("");
    setResults([]);
    setSelectedTrain(null);
    setRoutePoints([]);
    setAccessRouteMeta(null);

    try {
      const res = await api.get("/api/train/search-nearby", {
        params: {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          toStationId: destinationStationId,
          ...(day ? { day } : {}),
          candidateLimit: 5,
        },
      });

      const trains = Array.isArray(res.data?.trains) ? res.data.trains : [];
      const nearby = Array.isArray(res.data?.nearbyStations)
        ? res.data.nearbyStations
        : [];

      setResults(trains);
      setNearestStations(nearby);

      if (trains.length > 0) {
        await selectTrain(trains[0]);
      }
    } catch (e2) {
      setError(e2?.response?.data?.message || "Failed to search nearby trains");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function selectTrain(train) {
    setSelectedTrain(train);
    setRoutePoints([]);
    setAccessRouteMeta(null);

    const boardingLocation = normalizeLocation(train?.boardingStation?.location);
    if (!currentLocation || !boardingLocation) return;

    try {
      setRouting(true);

      const route = await getRoute(
        { lat: currentLocation.lat, lng: currentLocation.lng },
        { lat: boardingLocation.lat, lng: boardingLocation.lng }
      );

      setRoutePoints(route.pathLatLng);
      setAccessRouteMeta({
        distanceKm: route.distanceMeters / 1000,
        durationMins: route.durationSeconds / 60,
      });
    } catch {
      // fallback: keep backend estimate visible even if OSRM fails
      setRoutePoints([]);
      setAccessRouteMeta(null);
    } finally {
      setRouting(false);
    }
  }

  function normalizeLocation(location) {
    if (!location) return null;

    if (
      typeof location?.lat === "number" &&
      typeof location?.lng === "number"
    ) {
      return { lat: location.lat, lng: location.lng };
    }

    if (
      Array.isArray(location?.coordinates) &&
      location.coordinates.length >= 2
    ) {
      return {
        lng: Number(location.coordinates[0]),
        lat: Number(location.coordinates[1]),
      };
    }

    return null;
  }

  const boardingPoint = selectedTrain
    ? normalizeLocation(selectedTrain.boardingStation?.location)
    : null;

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-950">
            <TrainFront className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Train search from my location
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Use your current location, find the nearest valid boarding stop,
              and view train services to your destination.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Current location</div>
                <div className="mt-1 text-sm text-zinc-400">
                  {currentLocation
                    ? `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`
                    : "Not selected yet"}
                </div>
              </div>

              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="inline-flex items-center rounded-2xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900 disabled:opacity-60"
              >
                <LocateFixed className="mr-2 h-4 w-4" />
                {locating ? "Locating..." : "Use my location"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="text-sm font-medium">Nearest active stations</div>
            <div className="mt-3 grid gap-2">
              {nearestStations.length === 0 ? (
                <div className="text-sm text-zinc-500">
                  Get your location to see nearby stations.
                </div>
              ) : (
                nearestStations.map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-zinc-500">
                        {s.distanceKm} km • ~{s.accessEstimateMinutes} mins
                      </div>
                    </div>
                    <MapPin className="h-4 w-4 text-zinc-500" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-6 grid gap-4 md:grid-cols-12">
          <div className="md:col-span-5">
            <label className="mb-2 block text-sm text-zinc-300">Destination station</label>
            <select
              value={destinationStationId}
              onChange={(e) => setDestinationStationId(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-white/30"
              disabled={loadingStations}
            >
              <option value="">Select destination</option>
              {stations.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-center md:col-span-1">
            <button
              type="button"
              onClick={swapDestinationWithNearest}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
              title="Use nearest station quickly"
            >
              <ArrowRightLeft className="h-5 w-5" />
            </button>
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

          <div className="md:col-span-3 flex items-end">
            <button
              type="submit"
              disabled={!canSearch || searching}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 font-medium text-zinc-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search className="mr-2 h-4 w-4" />
              {searching ? "Searching..." : "Search trains"}
            </button>
          </div>
        </form>

        {destinationStation ? (
          <div className="mt-4 text-sm text-zinc-400">
            Destination: <span className="text-zinc-200">{destinationStation.name}</span>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Access route map</div>
                <div className="text-sm text-zinc-400">
                  Current location to selected boarding station
                </div>
              </div>

              {routing ? (
                <div className="text-sm text-zinc-500">Routing...</div>
              ) : null}
            </div>

            {currentLocation && boardingPoint ? (
              <RouteMap
                pickup={currentLocation}
                dropoff={boardingPoint}
                routePoints={routePoints}
              />
            ) : (
              <div className="flex h-[520px] items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/40 text-sm text-zinc-500">
                Search trains and select a result to see the route to the boarding station.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 grid gap-4">
          {results.length === 0 ? (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-6 text-sm text-zinc-400">
              No train results yet. Select your location and destination, then search.
            </div>
          ) : null}

          {results.map((train) => {
            const active = selectedTrain?._id === train._id;

            return (
              <article
                key={train._id}
                className={
                  "rounded-3xl border p-5 transition cursor-pointer " +
                  (active
                    ? "border-white bg-white text-zinc-950"
                    : "border-zinc-800 bg-zinc-950/30 hover:bg-zinc-900/50")
                }
                onClick={() => selectTrain(train)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={active ? "text-zinc-700 text-xs uppercase tracking-wide" : "text-zinc-500 text-xs uppercase tracking-wide"}>
                      {train.trainNo}
                    </div>
                    <h2 className="mt-1 text-lg font-semibold">
                      {train.trainName || "Unnamed train service"}
                    </h2>
                  </div>

                  <div className={active ? "text-zinc-700 text-sm" : "text-zinc-400 text-sm"}>
                    {train.searchDay || "Base"}
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
                    <div className={active ? "text-zinc-700 text-xs" : "text-zinc-500 text-xs"}>
                      Boarding stop near you
                    </div>
                    <div className="mt-1 font-medium">
                      {train.boardingStation?.name}
                    </div>
                    <div className={active ? "mt-1 text-sm text-zinc-700" : "mt-1 text-sm text-zinc-400"}>
                      {train.boardingStation?.distanceKm} km away • ~
                      {train.boardingStation?.accessEstimateMinutes} mins
                    </div>
                    <div className={active ? "mt-1 text-sm text-zinc-700" : "mt-1 text-sm text-zinc-400"}>
                      Train departs at {train.boardingStation?.departureTime || "-"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
                    <div className={active ? "text-zinc-700 text-xs" : "text-zinc-500 text-xs"}>
                      Destination
                    </div>
                    <div className="mt-1 font-medium">
                      {train.destinationStation?.name}
                    </div>
                    <div className={active ? "mt-1 text-sm text-zinc-700" : "mt-1 text-sm text-zinc-400"}>
                      Arrival at {train.destinationStation?.arrivalTime || "-"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm">
                    <span>Capacity: {train.seatCapacity}</span>
                    <span>Duration: {train.durationLabel || "-"}</span>
                    <span>Stops: {train.stopsBetween?.length || 0}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
  <Link
    to={`/train-service/${train._id}${day ? `?day=${day}` : ""}`}
    onClick={(e) => e.stopPropagation()}
    className={
      active
        ? "inline-flex items-center rounded-2xl border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100"
        : "inline-flex items-center rounded-2xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900"
    }
  >
    View schedule
  </Link>

  <Link
    to={`/train-service/${train._id}/book?${new URLSearchParams({
      ...(day ? { day } : {}),
      ...(train?.boardingStation?._id ? { fromStationId: train.boardingStation._id } : {}),
      ...(train?.destinationStation?._id ? { toStationId: train.destinationStation._id } : {}),
    }).toString()}`}
    onClick={(e) => e.stopPropagation()}
    className={
      active
        ? "inline-flex items-center rounded-2xl bg-zinc-950 px-4 py-2 text-sm text-white hover:opacity-90"
        : "inline-flex items-center rounded-2xl bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:opacity-90"
    }
  >
    Book now
  </Link>
</div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {selectedTrain ? (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-6">
          <div className="flex items-start gap-3">
            <Navigation className="mt-0.5 h-5 w-5 text-zinc-400" />
            <div>
              <div className="text-lg font-semibold">Selected journey summary</div>
              <div className="mt-2 text-sm text-zinc-400">
                Walk/ride to <span className="text-zinc-200">{selectedTrain.boardingStation?.name}</span>,
                then board <span className="text-zinc-200">{selectedTrain.trainName || selectedTrain.trainNo}</span>
                {" "}to <span className="text-zinc-200">{selectedTrain.destinationStation?.name}</span>.
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <div className="text-xs text-zinc-500">Backend estimate</div>
                  <div className="mt-1 font-medium">
                    {selectedTrain.boardingStation?.distanceKm} km
                  </div>
                  <div className="text-sm text-zinc-400">
                    ~{selectedTrain.boardingStation?.accessEstimateMinutes} mins to station
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <div className="text-xs text-zinc-500">Map route</div>
                  <div className="mt-1 font-medium">
                    {accessRouteMeta ? `${accessRouteMeta.distanceKm.toFixed(2)} km` : "-"}
                  </div>
                  <div className="text-sm text-zinc-400">
                    {accessRouteMeta ? `~${Math.round(accessRouteMeta.durationMins)} mins` : "Route not ready"}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <div className="text-xs text-zinc-500">Train journey</div>
                  <div className="mt-1 font-medium">
                    {selectedTrain.durationLabel || "-"}
                  </div>
                  <div className="text-sm text-zinc-400">
                    Departs {selectedTrain.boardingStation?.departureTime || "-"} • Arrives {selectedTrain.destinationStation?.arrivalTime || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}