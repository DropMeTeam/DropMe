import { useMemo, useState } from "react";
import { BusFront, ChevronRight } from "lucide-react";

const DEFAULT_MATCH_RADIUS_KM = 2;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(pointA, pointB) {
  if (!pointA || !pointB) return Number.POSITIVE_INFINITY;

  const earthRadiusKm = 6371;

  const latDelta = toRadians((pointB.lat || 0) - (pointA.lat || 0));
  const lngDelta = toRadians((pointB.lng || 0) - (pointA.lng || 0));
  const startLat = toRadians(pointA.lat || 0);
  const endLat = toRadians(pointB.lat || 0);

  const haversineValue =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(startLat) *
      Math.cos(endLat) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

  const angularDistance =
    2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return earthRadiusKm * angularDistance;
}

function buildOrderedRoutePoints(route) {
  const sortedStops = Array.isArray(route?.stops)
    ? [...route.stops].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  const points = [];

  if (route?.start) {
    points.push({
      ...route.start,
      routeOrder: 0,
      pointType: "START",
    });
  }

  sortedStops.forEach((stop, index) => {
    points.push({
      ...stop,
      routeOrder: Number.isFinite(stop?.order) ? stop.order : index + 1,
      pointType: "STOP",
    });
  });

  if (route?.end) {
    points.push({
      ...route.end,
      routeOrder: sortedStops.length + 1,
      pointType: "END",
    });
  }

  return points;
}

function findNearestPoint(passengerPoint, routePoints, radiusKm) {
  let nearestMatch = null;

  for (const routePoint of routePoints) {
    const distanceKm = getDistanceKm(passengerPoint, routePoint);

    if (!nearestMatch || distanceKm < nearestMatch.distanceKm) {
      nearestMatch = {
        ...routePoint,
        distanceKm,
      };
    }
  }

  if (!nearestMatch) return null;
  if (nearestMatch.distanceKm > radiusKm) return null;

  return nearestMatch;
}

function shortLabel(label = "") {
  return String(label).split(",")[0].trim();
}

function buildMatchedRoute(route, passengerFrom, passengerTo, radiusKm) {
  const orderedPoints = buildOrderedRoutePoints(route);

  if (!orderedPoints.length) return null;

  const fromMatch = findNearestPoint(passengerFrom, orderedPoints, radiusKm);
  const toMatch = findNearestPoint(passengerTo, orderedPoints, radiusKm);

  if (!fromMatch || !toMatch) return null;
  if (fromMatch.routeOrder === toMatch.routeOrder) return null;

  const travelDirection =
    fromMatch.routeOrder < toMatch.routeOrder ? "A_TO_B" : "B_TO_A";

  return {
    ...route,
    fromMatch,
    toMatch,
    travelDirection,
    passengerStartLabel: shortLabel(fromMatch.label),
    passengerEndLabel: shortLabel(toMatch.label),
  };
}

export default function BusRouteCards({
  routes = [],
  searchData,
  loading = false,
  matchRadiusKm = DEFAULT_MATCH_RADIUS_KM,
  onRouteSelect,
  selectedRouteId = "",
}) {
  const [activeTab, setActiveTab] = useState("NORMAL");

  const groupedRoutes = useMemo(() => {
    if (!searchData?.from || !searchData?.to) {
      return {
        NORMAL: [],
        EXPRESS: [],
      };
    }

    const matchedRoutes = routes
      .map((route) =>
        buildMatchedRoute(route, searchData.from, searchData.to, matchRadiusKm)
      )
      .filter(Boolean);

    return {
      NORMAL: matchedRoutes.filter((route) => route.routeType === "NORMAL"),
      EXPRESS: matchedRoutes.filter((route) => route.routeType === "EXPRESS"),
    };
  }, [routes, searchData, matchRadiusKm]);

  const visibleRoutes = groupedRoutes[activeTab] || [];

  if (!searchData?.from || !searchData?.to || !searchData?.date) {
    return (
      <section className="mt-8 rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,24,0.96)_0%,rgba(4,7,15,0.98)_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
        <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/55">
          Search with from, to, and date to view available routes.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,24,0.96)_0%,rgba(4,7,15,0.98)_100%)] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.4)]">
      <div className="mx-auto w-full">
        <div className="flex flex-wrap items-center gap-3">
          <TabButton
            active={activeTab === "NORMAL"}
            onClick={() => setActiveTab("NORMAL")}
          >
            Normal
          </TabButton>

          <TabButton
            active={activeTab === "EXPRESS"}
            onClick={() => setActiveTab("EXPRESS")}
          >
            Expressway
          </TabButton>
        </div>

        <div className="mt-6 min-h-[180px]">
          {loading ? (
            <StateBox text="Loading routes..." />
          ) : visibleRoutes.length === 0 ? (
            <StateBox
              text={`No ${
                activeTab === "NORMAL" ? "normal" : "expressway"
              } routes found.`}
            />
          ) : (
            <div className="grid gap-4">
              {visibleRoutes.map((route) => (
                <RouteCard
                  key={route._id || route.routeNumber}
                  route={route}
                  selected={selectedRouteId === route._id}
                  onClick={() => onRouteSelect?.(route)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "min-w-[180px] rounded-xl border px-5 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "border-black bg-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.05)_100%)] text-white/75 hover:border-white/20 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StateBox({ text }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-6 text-sm text-white/60">
      {text}
    </div>
  );
}

function RouteCard({ route, selected, onClick }) {
  const startLabel = shortLabel(route?.start?.label);
  const endLabel = shortLabel(route?.end?.label);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={[
        "group overflow-hidden rounded-[22px] border bg-[linear-gradient(180deg,#040816_0%,#02050d_100%)] shadow-[0_14px_36px_rgba(0,0,0,0.32)] transition-all duration-300 cursor-pointer",
        selected
          ? "border-sky-400/60 shadow-[0_18px_42px_rgba(56,189,248,0.18)]"
          : "border-white/10 hover:border-white/20 hover:shadow-[0_18px_42px_rgba(0,0,0,0.42)]",
      ].join(" ")}
    >
      <div className="grid min-h-[96px] grid-cols-1 md:grid-cols-[220px_1fr]">
        <div className="flex items-center gap-3 border-b border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(36,58,112,0.18),transparent_45%),linear-gradient(180deg,#060b1b_0%,#030711_100%)] px-5 py-4 md:border-b-0 md:border-r md:border-r-white/6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] shadow-inner">
            <BusFront className="h-6 w-6 text-white" />
          </div>

          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#90a0c0]">
              Route No
            </div>
            <div className="mt-2 text-[1.7rem] font-semibold leading-none tracking-tight text-white">
              {route?.routeNumber || "-"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 bg-[linear-gradient(180deg,#030303_0%,#000000_100%)] px-6 py-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.28em] text-white/35">
              Journey
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-lg font-semibold tracking-tight text-white md:text-[1.55rem]">
              <span className="truncate">{startLabel || "-"}</span>
              <span className="shrink-0 text-white/70">-&gt;</span>
              <span className="truncate">{endLabel || "-"}</span>
            </div>
          </div>

          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white md:flex">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </article>
  );
}