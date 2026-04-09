import { Link, useLocation } from "react-router-dom";
import { Bus, Route as RouteIcon } from "lucide-react";

const plannerTabs = [
  {
    label: "Trip Planner",
    to: "/plan",
    icon: RouteIcon,
  },
  {
    label: "Bus Booking",
    to: "/bus-booking",
    icon: Bus,
  },
];

export default function TransportPlannerNav() {
  const location = useLocation();

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-3">
        {plannerTabs.map(({ label, to, icon: Icon }) => {
          const isActive = location.pathname === to;

          return (
            <Link
              key={to}
              to={to}
              className={[
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-white text-black shadow-sm"
                  : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}