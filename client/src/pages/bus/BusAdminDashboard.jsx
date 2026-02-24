import { useNavigate } from "react-router-dom";
import { Bus, Route, BadgeCheck } from "lucide-react";

export default function BusAdminDashboard() {
  const nav = useNavigate();

  return (
    <div className="p-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Bus Admin</h1>
          </div>
          <div className="text-sm text-zinc-400">Module: Routes • Schedules • Approvals</div>
        </div>

        <p className="mt-2 text-sm text-zinc-400">
          Operational governance console: manage route master-data and execute fleet onboarding approvals.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn" onClick={() => nav("/bus/routes")}>
            <Route className="h-4 w-4" />
            <span className="ml-2">Manage Bus Routes</span>
          </button>

          <button className="btn" onClick={() => nav("/bus/approvals")}>
            <BadgeCheck className="h-4 w-4" />
            <span className="ml-2">Approve Bus Registrations</span>
          </button>

          {/* Keep schedules as future-ready if page not built yet */}
          <button className="btn" disabled title="Coming next">
            Manage Schedules (Next)
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="font-semibold mb-2">Operational Workflow</div>
          <div className="text-sm text-zinc-400 leading-6">
            1) Create bus routes (NORMAL / EXPRESS) with start, end, and ordered stops. <br />
            2) Owners register buses to a route. <br />
            3) Admin approves or rejects onboarding requests. <br />
            4) Admin publishes schedules per route (next).
          </div>
        </div>
      </div>
    </div>
  );
}