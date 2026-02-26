import { NavLink, Outlet } from "react-router-dom";

const linkBase =
  "rounded-xl px-3 py-2 text-sm font-semibold border border-zinc-800";
const linkActive = "bg-white text-zinc-950";
const linkIdle = "bg-zinc-950/30 text-zinc-200 hover:bg-zinc-900";

export default function TrainLayout() {
  return (
    <div className="grid gap-4">
      <div className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Train Admin</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage stations, schedules and timetables.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <NavLink
              to="/train"
              end
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkIdle}`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/train/stations"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkIdle}`
              }
            >
              Stations
            </NavLink>

            <NavLink
              to="/train/schedules"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkIdle}`
              }
            >
              Schedules
            </NavLink>

            <NavLink
              to="/train/timetables"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkIdle}`
              }
            >
              Timetables
            </NavLink>
          </div>
        </div>
      </div>

      <Outlet />
    </div>
  );
}
