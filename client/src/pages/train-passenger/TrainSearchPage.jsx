import { useEffect, useMemo, useState } from "react";

import api from "../../lib/api";
import { getRoute } from "../../lib/osrm";

import TrainSearchSidebar from "./components/TrainSearchSidebar";
import SearchMapPanel from "./components/SearchMapPanel";
import AvailableTrainsPanel from "./components/AvailableTrainsPanel";
import JourneySummarySidebar from "./components/JourneySummarySidebar";

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

function hhmmToMinutes(value) {
  if (!value || typeof value !== "string" || !value.includes(":")) return 0;

  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;

  return h * 60 + m;
}

function durationLabelToMinutes(label) {
  if (!label || typeof label !== "string") return Number.MAX_SAFE_INTEGER;

  const hourMatch = label.match(/(\d+)\s*h/i);
  const minuteMatch = label.match(/(\d+)\s*m/i);

  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;

  return hours * 60 + minutes;
}

export default function TrainSearchPage() {
  const [stations, setStations] = useState([]);

  const [destinationStationId, setDestinationStationId] = useState("");
  const [day, setDay] = useState("");

  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearestStations, setNearestStations] = useState([]);

  const [results, setResults] = useState([]);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [sortMode, setSortMode] = useState("earliest");

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

        if (mounted) {
          setStations(rows);
        }
      } catch (e) {
        if (mounted) {
          setError(e?.response?.data?.message || "Failed to load stations");
        }
      } finally {
        if (mounted) {
          setLoadingStations(false);
        }
      }
    }

    loadStations();

    return () => {
      mounted = false;
    };
  }, []);

  const destinationStation = useMemo(() => {
    return stations.find((station) => station._id === destinationStationId) || null;
  }, [stations, destinationStationId]);

  const canSearch = useMemo(() => {
    return Boolean(currentLocation?.lat && currentLocation?.lng && destinationStationId);
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

  async function handleSearch(e) {
    e?.preventDefault?.();
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
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to search nearby trains");
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
      setRoutePoints([]);
      setAccessRouteMeta(null);
    } finally {
      setRouting(false);
    }
  }

  const sortedResults = useMemo(() => {
    const copy = [...results];

    if (sortMode === "fastest") {
      return copy.sort(
        (a, b) =>
          durationLabelToMinutes(a?.durationLabel) -
          durationLabelToMinutes(b?.durationLabel)
      );
    }

    return copy.sort(
      (a, b) =>
        hhmmToMinutes(a?.boardingStation?.departureTime) -
        hhmmToMinutes(b?.boardingStation?.departureTime)
    );
  }, [results, sortMode]);

  const boardingPoint = useMemo(() => {
    return selectedTrain
      ? normalizeLocation(selectedTrain?.boardingStation?.location)
      : null;
  }, [selectedTrain]);

  const selectedFare = useMemo(() => {
    return (
      selectedTrain?.estimatedFareLkr ??
      selectedTrain?.fareLkr ??
      selectedTrain?.priceLkr ??
      selectedTrain?.ticketPriceLkr ??
      null
    );
  }, [selectedTrain]);

  const scheduleHref = useMemo(() => {
    if (!selectedTrain?._id) return "#";
    return `/train-service/${selectedTrain._id}${day ? `?day=${day}` : ""}`;
  }, [selectedTrain, day]);

  const bookingHref = useMemo(() => {
    if (!selectedTrain?._id) return "#";

    const params = new URLSearchParams({
      ...(day ? { day } : {}),
      ...(selectedTrain?.boardingStation?._id
        ? { fromStationId: selectedTrain.boardingStation._id }
        : {}),
      ...(selectedTrain?.destinationStation?._id
        ? { toStationId: selectedTrain.destinationStation._id }
        : {}),
    });

    return `/train-service/${selectedTrain._id}/book?${params.toString()}`;
  }, [selectedTrain, day]);

  return (
    <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 bg-[#030814]">
<div className="grid min-h-[calc(100vh-72px)] grid-cols-1 gap-0 xl:grid-cols-[420px_minmax(0,1fr)_360px]">        <TrainSearchSidebar
          currentLocation={currentLocation}
          locating={locating}
          onUseMyLocation={useMyLocation}
          stations={stations}
          loadingStations={loadingStations}
          destinationStationId={destinationStationId}
          onDestinationChange={setDestinationStationId}
          day={day}
          onDayChange={setDay}
          onSearch={handleSearch}
          canSearch={canSearch}
          searching={searching}
          nearestStations={nearestStations}
        />

        <div className="min-w-0  bg-[#040a16] px-0 py-0">
          <div className="space-y-0">
            <SearchMapPanel
              currentLocation={currentLocation}
              selectedTrain={selectedTrain}
              boardingPoint={boardingPoint}
              routePoints={routePoints}
              routing={routing}
            />

            {error ? (
              <div className="rounded-none border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <AvailableTrainsPanel
              results={sortedResults}
              selectedTrainId={selectedTrain?._id || ""}
              onSelectTrain={selectTrain}
              sortMode={sortMode}
              onSortModeChange={setSortMode}
              searching={searching}
              destinationStation={destinationStation}
            />
          </div>
        </div>

        <JourneySummarySidebar
          selectedTrain={selectedTrain}
          accessRouteMeta={accessRouteMeta}
          scheduleHref={scheduleHref}
          bookingHref={bookingHref}
          selectedFare={selectedFare}
        />
      </div>
    </div>
  );
}