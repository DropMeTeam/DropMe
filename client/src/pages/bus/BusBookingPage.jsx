import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bus } from "lucide-react";
import BusPassengerSearch from "../../components/bus/BusPassengerSearch";
import BusRoutePreviewMap from "../../components/bus/BusRoutePreviewMap";
import BusRouteCards from "../../components/bus/BusRouteCards";
import BusRouteBuses from "../../components/bus/BusRouteBuses";
import { getRoute } from "../../lib/osrm";
import { api } from "../../lib/api";

const initialSearchState = {
  from: null,
  to: null,
  date: "",
};

function getDayOfWeekFromDate(dateString) {
  if (!dateString) return null;
  return new Date(`${dateString}T00:00:00`).getDay();
}

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function validateTravelDate(dateString) {
  if (!dateString) {
    return "Please select a travel date.";
  }

  const selected = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(selected.getTime())) {
    return "Selected travel date is invalid.";
  }

  const today = getTodayStart();
  const maxAllowed = addDays(today, 7);

  if (selected < today) {
    return "Passenger can select only today or future dates.";
  }

  if (selected > maxAllowed) {
    return "Passenger can select only up to 1 week from today.";
  }

  return "";
}

export default function BusBookingPage() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState(initialSearchState);
  const [routePoints, setRoutePoints] = useState([]);
  const [meta, setMeta] = useState(null);
  const [busRoutes, setBusRoutes] = useState([]);
  

  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeBusesLoading, setRouteBusesLoading] = useState(false);
  const [routeBuses, setRouteBuses] = useState([]);

  async function handleBusSearch(payload) {
    const dateError = validateTravelDate(payload?.date);

    if (dateError) {
      setValidationMsg(dateError);
      setBusRoutes([]);
      setSelectedRoute(null);
      setRouteBuses([]);
      setRoutePoints([]);
      setMeta(null);
      alert(dateError);
      return;
    }

    
    setLoading(true);

    try {
      const [previewRoute, routesResponse] = await Promise.all([
        getRoute(payload.from, payload.to),
        api.get("/api/bus/routes"),
      ]);

      const routes =
        routesResponse?.data?.routes && Array.isArray(routesResponse.data.routes)
          ? routesResponse.data.routes
          : [];

      setSearchData(payload);
      setRoutePoints(previewRoute?.pathLatLng || []);
      setMeta(previewRoute || null);
      setBusRoutes(routes);

      setSelectedRoute(null);
      setRouteBuses([]);
    } catch (error) {
      console.error("Failed to load bus booking data:", error);
      alert("Failed to load matching bus routes.");
      setRoutePoints([]);
      setMeta(null);
      setBusRoutes([]);
      setSelectedRoute(null);
      setRouteBuses([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRouteSelect(route) {
    if (!route?._id) return;

    setSelectedRoute(route);
    setRouteBusesLoading(true);

    try {
      const response = await api.get(`/api/bus/routes/${route._id}/schedules`);

      const schedules = Array.isArray(response?.data?.schedules)
        ? response.data.schedules
        : [];

      const targetDay = getDayOfWeekFromDate(searchData.date);

      const filteredSchedules = schedules.filter((schedule) => {
        return (
          schedule?.direction === route.travelDirection &&
          schedule?.dayOfWeek === targetDay
        );
      });

      const uniqueBuses = new Map();

      filteredSchedules.forEach((schedule) => {
        const bus = schedule?.busId;

        if (!bus?._id) return;
        if (uniqueBuses.has(bus._id)) return;

        uniqueBuses.set(bus._id, {
          bus,
          schedule,
          availableSeats: Number(bus?.seatsTotal || 0),
        });
      });

      setRouteBuses(Array.from(uniqueBuses.values()));
    } catch (error) {
      console.error("Failed to load buses for route:", error);
      alert("Failed to load buses for selected route.");
      setRouteBuses([]);
    } finally {
      setRouteBusesLoading(false);
    }
  }

  const hasRoutePreview =
    !!searchData.from &&
    !!searchData.to &&
    !!searchData.date &&
    routePoints.length > 0;

  return (
    <div className="min-h-screen bg-[#060812] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => nav("/buses")}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
            <Bus className="h-6 w-6 text-white" />
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Bus Booking
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Search available buses and filter matching passenger routes.
            </p>
            <p className="mt-1 text-xs text-cyan-200/80">
              Travel date allowed: today up to 1 week only.
            </p>
          </div>
        </div>

        

        <BusPassengerSearch
          onSearch={handleBusSearch}
          loading={loading}
          initialValues={searchData}
        />

        {hasRoutePreview ? (
          <BusRoutePreviewMap
            from={searchData.from}
            to={searchData.to}
            travelDate={searchData.date}
            routePoints={routePoints}
            meta={meta}
          />
        ) : (
          <section className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-white">Route Preview</h3>
            <p className="mt-2 text-sm text-white/55">
              Search with departure, destination, and date to render the map path,
              distance, and ETA.
            </p>
          </section>
        )}

        <BusRouteCards
          routes={busRoutes}
          searchData={searchData}
          loading={loading}
          onRouteSelect={handleRouteSelect}
          selectedRouteId={selectedRoute?._id || ""}
        />

        <BusRouteBuses
          route={selectedRoute}
          busItems={routeBuses}
          loading={routeBusesLoading}
          searchData={searchData}
        />
      </div>
    </div>
  );
}