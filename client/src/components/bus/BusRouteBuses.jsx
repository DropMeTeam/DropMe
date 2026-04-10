import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../state/AuthContext";
import {
  BusFront,
  Users,
  Sparkles,
  Ticket,
  ArrowRight,
  Route as RouteIcon,
  LayoutGrid,
} from "lucide-react";
import { api } from "../../lib/api";
import { calculateBusFare, formatLkr } from "../../lib/busFare";
import { getBusLayoutType } from "../../lib/busSeatLayout";

function shortLabel(label = "") {
  return String(label).split(",")[0].trim();
}

function buildAbsoluteImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;

  const baseUrl = api?.defaults?.baseURL || "http://localhost:5000";
  const cleanBase = String(baseUrl).replace(/\/$/, "");

  return `${cleanBase}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function BusRouteBuses({
  route,
  busItems = [],
  loading = false,
  searchData,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const routeTitle = useMemo(() => {
    if (!route) return "";
    return `${shortLabel(route?.start?.label)} -> ${shortLabel(route?.end?.label)}`;
  }, [route]);

  if (!route) {
    return (
      <section className="mt-8 rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,24,0.96)_0%,rgba(4,7,15,0.98)_100%)] p-5">
        <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-white/55">
          Select a route to view available buses.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,24,0.96)_0%,rgba(4,7,15,0.98)_100%)] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Available Buses</h3>
          <p className="mt-1 text-sm text-white/60">
            Route {route?.routeNumber || "-"} · {routeTitle}
          </p>
          <p className="mt-1 text-xs text-white/45">
            Direction: {route?.travelDirection === "B_TO_A" ? "Reverse" : "Forward"} ·
            Date: {searchData?.date || "-"}
          </p>
          <p className="mt-1 text-xs text-white/45">
            Passenger Distance: {Number(route?.passengerDistanceKm || 0).toFixed(1)} km
          </p>
        </div>

        <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-xs text-sky-200">
          Dynamic fare + seat layout ready
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-6 text-sm text-white/60">
            Loading buses...
          </div>
        ) : busItems.length === 0 ? (
          <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-6 text-sm text-white/60">
            No buses found for this route, direction, and date.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {busItems.map((item) => {
              const bus = item.bus || {};
              const busPhoto = buildAbsoluteImageUrl(bus.photoUrl);

              const fare = calculateBusFare({
                busType: bus.busType,
                distanceKm: route?.passengerDistanceKm || 0,
              });

              const seatLayoutType = getBusLayoutType(
                bus.busType,
                Number(bus.seatsTotal || 0)
              );

              const goToDetails = () => {
                if (!user || user.role !== "rider") {
                  alert("Please log in as a passenger to continue bus booking.");
                  navigate("/login");
                  return;
                }
              
                navigate("/buses/search/details", {
                  state: {
                    bus,
                    schedule: item.schedule,
                    route,
                    searchData,
                    ticketPriceLkr: fare.fareLkr,
                    passengerDistanceKm: fare.distanceKm,
                    seatLayoutType,
                  },
                });
              };

              return (
                <article
                  key={bus._id || bus.id || bus.plateNumber}
                  role="button"
                  tabIndex={0}
                  onClick={goToDetails}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goToDetails();
                    }
                  }}
                  className="cursor-pointer overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,#07101f_0%,#040813_100%)] shadow-[0_14px_30px_rgba(0,0,0,0.3)] transition hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_18px_40px_rgba(0,0,0,0.4)]"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden bg-black/30">
                    {busPhoto ? (
                      <img
                        src={busPhoto}
                        alt={bus.plateNumber || "Bus"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-white/35">
                        <BusFront className="h-10 w-10" />
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.28em] text-white/35">
                          Bus No
                        </div>
                        <div className="mt-1 text-xl font-semibold text-white">
                          {bus.plateNumber || "-"}
                        </div>
                      </div>

                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                        {bus.busType || "-"}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <MetricRow
                        icon={<Users className="h-4 w-4" />}
                        label="Available seats"
                        value={`${item.availableSeats}`}
                      />

                      <MetricRow
                        icon={<Ticket className="h-4 w-4" />}
                        label="Ticket price"
                        value={formatLkr(fare.fareLkr)}
                      />

                      <MetricRow
                        icon={<RouteIcon className="h-4 w-4" />}
                        label="Passenger distance"
                        value={`${fare.distanceKm} km`}
                      />

                      <MetricRow
                        icon={<LayoutGrid className="h-4 w-4" />}
                        label="Seat layout"
                        value={seatLayoutType}
                      />
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/35">
                        <Sparkles className="h-3.5 w-3.5" />
                        Features
                      </div>

                      {Array.isArray(bus.features) && bus.features.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {bus.features.map((feature, index) => (
                            <span
                              key={`${feature}-${index}`}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-white/45">No features listed</div>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4 text-sm font-medium text-white">
                      <span>Open booking details</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function MetricRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
      <div className="flex items-center gap-2 text-sm text-white/60">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}