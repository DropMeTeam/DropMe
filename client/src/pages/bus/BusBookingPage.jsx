import { useState } from "react";
import { Bus } from "lucide-react";
import TransportPlannerNav from "../../components/TransportPlannerNav";
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

export default function BusBookingPage() {
  const [loading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState(initialSearchState);
  const [routePoints, setRoutePoints] = useState([]);
  const [meta, setMeta] = useState(null);
  const [busRoutes, setBusRoutes] = useState([]);

  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeBusesLoading, setRouteBusesLoading] = useState(false);
  const [routeBuses, setRouteBuses] = useState([]);

  async function handleBusSearch(payload) {
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
        <TransportPlannerNav />

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