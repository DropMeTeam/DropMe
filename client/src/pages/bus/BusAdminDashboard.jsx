import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bus,
  Route,
  BadgeCheck,
  CalendarDays,
  ArrowRight,
  CheckCircle2,
  MapPinned,
  BusFront,
} from "lucide-react";
import { api } from "../../lib/api";

export default function BusAdminDashboard() {
  const nav = useNavigate();

  const [stats, setStats] = useState({
    routes: 0,
    pending: 0,
    approved: 0,
    loading: true,
  });

  useEffect(() => {
    loadSnapshot();
  }, []);

  // Safe count extractor for different backend response shapes
  function getCount(data, possibleArrayKeys = []) {
    if (typeof data?.count === "number") return data.count;
    if (typeof data?.total === "number") return data.total;
    if (typeof data?.length === "number" && Array.isArray(data)) return data.length;

    for (const key of possibleArrayKeys) {
      if (Array.isArray(data?.[key])) return data[key].length;
    }

    return 0;
  }

  // Try multiple endpoint candidates so dashboard does not break easily
  async function tryEndpoint(urls, possibleArrayKeys = []) {
    for (const url of urls) {
      try {
        const { data } = await api.get(url);
        return getCount(data, possibleArrayKeys);
      } catch {
        // Try next candidate URL
      }
    }
    return 0;
  }

  async function loadSnapshot() {
    setStats((prev) => ({ ...prev, loading: true }));

    try {
      const [routes, pending, approved] = await Promise.all([
        // Route count candidates
        tryEndpoint(
          ["/api/bus/routes", "/api/routes", "/api/admin/bus/routes"],
          ["routes", "data", "items"]
        ),

        // Pending registration count candidates
        tryEndpoint(
          ["/api/admin/bus-registrations/pending"],
          ["pending", "registrations", "data", "items"]
        ),

        // Approved bus count candidates
        tryEndpoint(
          [
            "/api/admin/bus-registrations/approved",
            "/api/admin/buses/approved",
            "/api/buses?status=approved",
          ],
          ["approved", "buses", "registrations", "data", "items"]
        ),
      ]);

      setStats({
        routes,
        pending,
        approved,
        loading: false,
      });
    } catch {
      setStats({
        routes: 0,
        pending: 0,
        approved: 0,
        loading: false,
      });
    }
  }

  const topCards = [
    {
      title: "Manage Bus Routes",
      desc: "Create, edit, and optimize NORMAL / EXPRESS routes.",
      icon: Route,
      onClick: () => nav("/bus/routes"),
    },
    {
      title: "Approve Bus Registrations",
      desc: "Review fleet onboarding requests and approve or reject buses.",
      icon: BadgeCheck,
      onClick: () => nav("/bus/approvals"),
    },
    {
      title: "Manage Schedules",
      desc: "Create and publish service schedules for each active route.",
      icon: CalendarDays,
      onClick: () => nav("/bus/schedules"),
    },
  ];

  const workflowSteps = [
    {
      no: "1",
      title: "Route Creation",
      desc: "Define start, end, and ordered stops for each operational route.",
      icon: MapPinned,
    },
    {
      no: "2",
      title: "Bus Registration",
      desc: "Fleet owners register buses under a selected approved route.",
      icon: BusFront,
    },
    {
      no: "3",
      title: "Admin Approval",
      desc: "Validate onboarding requests and approve or reject with control.",
      icon: CheckCircle2,
    },
    {
      no: "4",
      title: "Schedule Publishing",
      desc: "Create route-level schedules and activate service availability.",
      icon: CalendarDays,
    },
  ];

  return (
    <div className="min-h-screen bg-[#05070b] p-4 md:p-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="relative overflow-hidden rounded-[28px] border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.10)]">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(34,211,238,0.03),transparent)] pointer-events-none" />

          <div className="relative p-5 md:p-8">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.18)]">
                    <Bus className="h-6 w-6" />
                  </div>

                  <div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-white">
                      Bus Admin
                    </h1>
                    <p className="mt-1 text-sm md:text-base text-zinc-300">
                      Operational governance console: manage route master data and execute fleet onboarding approvals.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-zinc-400 lg:pt-2">
                Module: Routes • Schedules • Approvals
              </div>
            </div>

            {/* Top action cards */}
            <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-3">
              {topCards.map((card) => {
                const Icon = card.icon;

                return (
                  <button
                    key={card.title}
                    onClick={card.onClick}
                    className="group rounded-[24px] border border-cyan-400/35 bg-black/30 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/60 hover:bg-cyan-400/5 hover:shadow-[0_0_30px_rgba(34,211,238,0.18)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 transition-transform duration-300 group-hover:scale-105">
                        <Icon className="h-8 w-8" />
                      </div>

                      <div className="min-w-0">
                        <h2 className="text-xl font-semibold text-white">
                          {card.title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-zinc-300">
                          {card.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom section */}
            <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-[1.9fr_0.9fr]">
              {/* Workflow */}
              <div className="rounded-[24px] border border-white/10 bg-black/25 p-5 md:p-6 shadow-[0_0_25px_rgba(255,255,255,0.03)]">
                <h3 className="text-2xl font-semibold text-white">Workflow</h3>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {workflowSteps.map((step, index) => {
                    const Icon = step.icon;

                    return (
                      <div key={step.no} className="relative">
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 h-full">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/15">
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="text-sm font-medium tracking-wide text-zinc-400">
                              {step.no}.
                            </div>
                          </div>

                          <div className="mt-4">
                            <h4 className="text-lg font-semibold uppercase tracking-wide text-white">
                              {step.title}
                            </h4>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                              {step.desc}
                            </p>
                          </div>
                        </div>

                        {index < workflowSteps.length - 1 ? (
                          <div className="hidden xl:flex absolute -right-4 top-1/2 -translate-y-1/2 items-center text-zinc-500">
                            <ArrowRight className="h-5 w-5" />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live snapshot */}
              <div className="rounded-[24px] border border-white/10 bg-black/25 p-5 md:p-6 shadow-[0_0_25px_rgba(255,255,255,0.03)]">
                <h3 className="text-2xl font-semibold text-white">
                  Live Operations Snapshot
                </h3>

                <div className="mt-6 space-y-4">
                  <StatCard
                    label="Routes"
                    value={stats.loading ? "..." : stats.routes}
                    valueClass="text-cyan-300"
                  />

                  <StatCard
                    label="Pending Registrations"
                    value={stats.loading ? "..." : stats.pending}
                    valueClass="text-rose-400"
                  />

                  <StatCard
                    label="Approved Buses"
                    value={stats.loading ? "..." : stats.approved}
                    valueClass="text-emerald-300"
                  />
                </div>

                <button
                  onClick={loadSnapshot}
                  className="mt-6 w-full rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/15"
                >
                  Refresh Snapshot
                </button>
              </div>
            </div>

            <div className="mt-6 text-xs text-zinc-500">
              Built for learning & prototyping. Do not copy third-party branding.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, valueClass = "text-white" }) {
  const numericValue = Number(value);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5">
      <div className="text-sm text-zinc-400">{label}</div>

      <div className={`mt-2 text-4xl font-semibold ${valueClass}`}>
        {Number.isFinite(numericValue) ? (
          <AnimatedCount value={numericValue} duration={1200} />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function AnimatedCount({ value, duration = 1200 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let frameId;
    let startTime;

    const startValue = 0;
    const endValue = Number(value) || 0;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;

      const progress = Math.min((timestamp - startTime) / duration, 1);

      // ease-out effect
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const currentValue = Math.round(
        startValue + (endValue - startValue) * easedProgress
      );

      setCount(currentValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    }

    setCount(0);
    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <span>{count}</span>;
}