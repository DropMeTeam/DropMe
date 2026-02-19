import { Link } from "react-router-dom";
import { TrainFront } from "lucide-react";

export default function TrainAdminDashboard() {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2">
        <TrainFront className="h-5 w-5" />
        <h1 className="text-xl font-semibold">Train Admin</h1>
      </div>

      <p className="mt-2 text-sm text-zinc-400">
        Operational control panel for station master data, schedules, and timetables.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/train/stations" className="pill pill-active">Stations</Link>
        <Link to="/train/schedules" className="pill">Schedules</Link>
        <Link to="/train/timetables" className="pill">Timetables</Link>
      </div>
    </div>
  );
}
