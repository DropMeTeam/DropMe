import { Link } from "react-router-dom";
import { Car, ClipboardCheck, Users } from "lucide-react";

export default function PrivateAdminDashboard() {
  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Private Vehicle Admin</h1>
        </div>

        <p className="mt-2 text-sm text-zinc-400">
          Admin cockpit for private vehicle operations — approvals, compliance, and lifecycle control.
        </p>

        {/* ✅ Main CTA (fixes your “must type URL” problem) */}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/private/driver-approvals" className="btn btn-primary">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Driver Approvals
          </Link>
        </div>
      </div>

      {/* Optional quick cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          to="/private/driver-approvals"
          className="card p-6 hover:border-zinc-700 transition"
        >
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            <div className="text-sm font-semibold">Approve / Reject Drivers</div>
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            Review pending driver registrations and issue Driver IDs.
          </div>
        </Link>

        <div className="card p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <div className="text-sm font-semibold">Admin Controls</div>
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            Add more modules later (private vehicles, reports, etc.).
          </div>
        </div>
      </div>
    </div>
  );
}
