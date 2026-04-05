import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

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

function samePoint(a, b) {
  if (!a || !b) return false;
  return a.lat === b.lat && a.lng === b.lng;
}

function buildTrainPathPoints(train) {
  const raw = Array.isArray(train?.stopsBetween)
    ? train.stopsBetween
        .map((item) => normalizeLocation(item?.station?.location))
        .filter(Boolean)
    : [];

  const deduped = [];
  for (const point of raw) {
    const prev = deduped[deduped.length - 1];
    if (!samePoint(prev, point)) {
      deduped.push(point);
    }
  }

  return deduped;
}

export default function TrainSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stations, setStations] = useState([]);

  const [fromStationId, setFromStationId] = useState(
    searchParams.get("fromStationId") || ""
  );
  const [destinationStationId, setDestinationStationId] = useState(
    searchParams.get("toStationId") || ""
  );
  const [day, setDay] = useState(searchParams.get("day") || "");

  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearestStations, setNearestStations] = useState([]);

  const [results, setResults] = useState([]);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [sortMode, setSortMode] = useState("earliest");

  const [routePoints, setRoutePoints] = useState([]);
  const [trainRoutePoints, setTrainRoutePoints] = useState([]);
  const [accessRouteMeta, setAccessRouteMeta] = useState(null);

  const [loadingStations, setLoadingStations] = useState(true);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [routing, setRouting] = useState(false);
  const [error, setError] = useState("");

  const routeRequestRef = useRef(0);

  useEffect(() => {
    if (
      stations.length > 0 &&
      destinationStationId &&
      !searching &&
      results.length === 0
    ) {
      handleSearch();
    }
  }, [stations, destinationStationId]);

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
    return (
      stations.find((station) => station._id === destinationStationId) || null
    );
  }, [stations, destinationStationId]);

  const canSearch = useMemo(() => {
    if (fromStationId && destinationStationId) return true;
    return Boolean(
      currentLocation?.lat && currentLocation?.lng && destinationStationId
    );
  }, [currentLocation, fromStationId, destinationStationId]);

  async function syncSelectedTrainVisuals(
    train,
    locationOverride = currentLocation
  ) {
    const requestId = ++routeRequestRef.current;

    setSelectedTrain(train);
    setRoutePoints([]);
    setAccessRouteMeta(null);

    const nextTrainPath = buildTrainPathPoints(train);
    setTrainRoutePoints(nextTrainPath);

    const boardingLocation = normalizeLocation(train?.boardingStation?.location);
    const activeLocation = locationOverride || null;

    if (!activeLocation || !boardingLocation) {
      if (routeRequestRef.current === requestId) {
        setRouting(false);
      }
      return;
    }

    try {
      setRouting(true);

      const route = await getRoute(
        { lat: activeLocation.lat, lng: activeLocation.lng },
        { lat: boardingLocation.lat, lng: boardingLocation.lng }
      );

      if (routeRequestRef.current !== requestId) return;

      const nextRoutePoints = Array.isArray(route?.pathLatLng)
        ? route.pathLatLng
        : [];

      setRoutePoints(nextRoutePoints);
      setAccessRouteMeta({
        distanceKm: Number(route.distanceMeters || 0) / 1000,
        durationMins: Number(route.durationSeconds || 0) / 60,
      });
    } catch {
      if (routeRequestRef.current !== requestId) return;

      setRoutePoints([]);
      setAccessRouteMeta(null);
    } finally {
      if (routeRequestRef.current === requestId) {
        setRouting(false);
      }
    }
  }

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

        const nextLocation = {
          label: "My current location",
          lat,
          lng,
        };

        setCurrentLocation(nextLocation);

        try {
          const res = await api.get("/api/train/nearest-stations", {
            params: { lat, lng, limit: 5 },
          });

          setNearestStations(
            Array.isArray(res.data?.stations) ? res.data.stations : []
          );
        } catch (e) {
          setError(
            e?.response?.data?.message || "Failed to load nearest stations"
          );
          setNearestStations([]);
        } finally {
          setLocating(false);
        }

        if (selectedTrain) {
          await syncSelectedTrainVisuals(selectedTrain, nextLocation);
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
    setTrainRoutePoints([]);
    setAccessRouteMeta(null);

    const params = new URLSearchParams();
    if (fromStationId) params.set("fromStationId", fromStationId);
    if (destinationStationId) params.set("toStationId", destinationStationId);
    if (day) params.set("day", day);
    setSearchParams(params);

    try {
      const searchParamsObj = {
        toStationId: destinationStationId,
        ...(day ? { day } : {}),
        candidateLimit: 15,
      };

      if (fromStationId) {
        searchParamsObj.fromStationId = fromStationId;
      }

      if (currentLocation) {
        searchParamsObj.lat = currentLocation.lat;
        searchParamsObj.lng = currentLocation.lng;
      }

      const res = await api.get("/api/train/search-nearby", {
        params: searchParamsObj,
      });

      const trains = Array.isArray(res.data?.trains) ? res.data.trains : [];
      const nearby = Array.isArray(res.data?.nearbyStations)
        ? res.data.nearbyStations
        : [];

      setResults(trains);
      setNearestStations(nearby);

      if (trains.length > 0) {
        await syncSelectedTrainVisuals(trains[0]);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to search nearby trains");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function selectTrain(train) {
    await syncSelectedTrainVisuals(train);
  }

  const sortedResults = useMemo(() => {
    const copy = [...results];

    if (sortMode === "fastest") {
      return copy.sort((a, b) => {
        const aDur = Number.isFinite(a?.durationMinutes)
          ? a.durationMinutes
          : Number.MAX_SAFE_INTEGER;
        const bDur = Number.isFinite(b?.durationMinutes)
          ? b.durationMinutes
          : Number.MAX_SAFE_INTEGER;
        return aDur - bDur;
      });
    }

    return copy.sort((a, b) => {
      const aTime = hhmmToMinutes(a?.boardingStation?.departureTime);
      const bTime = hhmmToMinutes(b?.boardingStation?.departureTime);
      return aTime - bTime;
    });
  }, [results, sortMode]);

  const boardingPoint = useMemo(() => {
    return selectedTrain
      ? normalizeLocation(selectedTrain?.boardingStation?.location)
      : null;
  }, [selectedTrain]);

  const destinationPoint = useMemo(() => {
    return selectedTrain
      ? normalizeLocation(selectedTrain?.destinationStation?.location)
      : null;
  }, [selectedTrain]);

  const selectedFare = useMemo(() => {
    return (
      selectedTrain?.farePerSeatLkr ??
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
      <div className="grid min-h-[calc(100vh-72px)] grid-cols-1 gap-0 xl:grid-cols-[420px_minmax(0,1fr)_360px]">
        <TrainSearchSidebar
          currentLocation={currentLocation}
          locating={locating}
          onUseMyLocation={useMyLocation}
          stations={stations}
          loadingStations={loadingStations}
          fromStationId={fromStationId}
          onFromChange={setFromStationId}
          destinationStationId={destinationStationId}
          onDestinationChange={setDestinationStationId}
          day={day}
          onDayChange={setDay}
          onSearch={handleSearch}
          canSearch={canSearch}
          searching={searching}
          nearestStations={nearestStations}
        />

        <div className="min-w-0 bg-[#040a16] px-0 py-0">
          <div className="space-y-0">
            <SearchMapPanel
              currentLocation={currentLocation}
              selectedTrain={selectedTrain}
              boardingPoint={boardingPoint}
              destinationPoint={destinationPoint}
              routePoints={routePoints}
              trainRoutePoints={trainRoutePoints}
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