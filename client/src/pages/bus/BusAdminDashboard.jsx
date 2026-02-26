import { Bus } from "lucide-react";

export default function BusAdminDashboard() {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2">
        <Bus className="h-5 w-5" />
        <h1 className="text-xl font-semibold">Bus Admin</h1>
      </div>

      <p className="mt-2 text-sm text-zinc-400">
        Governance workspace for bus routes, schedules, and fleet operations (to be integrated).
      </p>
    </div>
  );
}
