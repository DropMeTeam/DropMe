import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bus,
  MapPinned,
  Route as RouteIcon,
  ShieldAlert,
} from "lucide-react";
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

function shortPlace(label = "") {
  if (!label) return "-";
  return String(label).split(",")[0].trim();
}

function formatTravelDate(dateString) {
  if (!dateString) return "--";
  const d = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toLocaleDateString();
}

function SectionCard({ title, subtitle, icon, children }) {
  return (
    <section className="relative overflow-hidden rounded-[26px] border border-sky-400/20 bg-[#0d1219] p-5 shadow-[0_0_0_1px_rgba(56,189,248,0.10),0_0_28px_rgba(56,189,248,0.10),0_14px_35px_rgba(0,0,0,0.24)] transition-all duration-300 hover:border-sky-300/35 hover:shadow-[0_0_0_1px_rgba(125,211,252,0.18),0_0_34px_rgba(56,189,248,0.18),0_14px_35px_rgba(0,0,0,0.24)]">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent" />

      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-300 shadow-[0_0_18px_rgba(56,189,248,0.18)]">
          {icon}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
        </div>
      </div>

      {children}
    </section>
  );
}

export default function BusBookingPage() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [validationMsg, setValidationMsg] = useState("");
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
      return;
    }

    setValidationMsg("");
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
      setValidationMsg("Failed to load matching bus routes.");
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
    setValidationMsg("");

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
      setValidationMsg("Failed to load buses for selected route.");
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

  const selectedRouteSummary = useMemo(() => {
    if (!selectedRoute) return "--";

    const start =
      shortPlace(selectedRoute?.start?.label) ||
      shortPlace(searchData?.from?.label) ||
      "-";

    const end =
      shortPlace(selectedRoute?.end?.label) ||
      shortPlace(searchData?.to?.label) ||
      "-";

    return `${start} → ${end}`;
  }, [selectedRoute, searchData]);

  return (
    <div className="min-h-screen bg-[#060812] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-5 md:px-6">
        <div className="rounded-[30px] border border-white/8 bg-[#090b10] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.35)] md:p-7">
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => nav("/buses")}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08]"
                title="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-400/15 bg-blue-400/10 text-blue-300">
                <Bus className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                  Bus Booking
                </h1>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                  Passenger Search & Route Matching
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
                  Search available buses, preview the travel path, compare matched
                  routes, and view buses assigned for the selected journey date.
                </p>
              </div>
            </div>
          </div>

          {validationMsg ? (
            <div className="mt-6 rounded-[20px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{validationMsg}</span>
              </div>
            </div>
          ) : null}

          <div className="mt-7">
            <SectionCard
              title="Passenger Journey Search"
              subtitle="Select boarding point, destination, and valid travel date."
              icon={<MapPinned className="h-5 w-5" />}
            >
              <BusPassengerSearch
                onSearch={handleBusSearch}
                loading={loading}
                initialValues={searchData}
              />
            </SectionCard>
          </div>

          <div className="mt-7">
            {hasRoutePreview ? (
              <SectionCard
                title="Route Preview"
                subtitle={`From ${shortPlace(searchData.from?.label)} to ${shortPlace(
                  searchData.to?.label
                )} on ${formatTravelDate(searchData.date)}`}
                icon={<RouteIcon className="h-5 w-5" />}
              >
                <BusRoutePreviewMap
                  from={searchData.from}
                  to={searchData.to}
                  travelDate={searchData.date}
                  routePoints={routePoints}
                  meta={meta}
                />
              </SectionCard>
            ) : (
              <section className="rounded-[26px] border border-dashed border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-lg font-semibold text-white">Route Preview</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  Search using departure, destination, and travel date to display
                  the map path, distance, and ETA preview.
                </p>
              </section>
            )}
          </div>

          <div className="mt-7 grid gap-7">
            <SectionCard
              title="Matching Bus Routes"
              subtitle="Review the routes that align with the selected passenger journey."
              icon={<RouteIcon className="h-5 w-5" />}
            >
              <BusRouteCards
                routes={busRoutes}
                searchData={searchData}
                loading={loading}
                onRouteSelect={handleRouteSelect}
                selectedRouteId={selectedRoute?._id || ""}
              />
            </SectionCard>

            <SectionCard
              title="Available Buses"
              subtitle={
                selectedRoute
                  ? `Showing buses for ${selectedRouteSummary}`
                  : "Select a route first to view assigned buses."
              }
              icon={<Bus className="h-5 w-5" />}
            >
              <BusRouteBuses
                route={selectedRoute}
                busItems={routeBuses}
                loading={routeBusesLoading}
                searchData={searchData}
              />
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}