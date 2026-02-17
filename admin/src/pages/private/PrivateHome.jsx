import { Link } from "react-router-dom";

export default function PrivateHome() {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Private Dashboard</h1>
            <p className="mt-2 text-sm text-black/60">
              Operational cockpit for private vehicle governance.
            </p>
          </div>

          <Link
            to="/private/drivers"
            className="rounded-xl border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5"
          >
            Driver Approvals →
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-black/10 p-6">
            <div className="text-lg font-semibold">Driver Registration Approvals</div>
            <p className="mt-1 text-sm text-black/60">
              Review pending driver + vehicle submissions, approve/reject, auto-generate Driver ID.
            </p>
            <Link
              to="/private/drivers"
              className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Open Approvals
            </Link>
          </div>

          <div className="rounded-2xl border border-black/10 p-6">
            <div className="text-lg font-semibold">Private Vehicle Module</div>
            <p className="mt-1 text-sm text-black/60">
              Private vehicle workflows can be plugged here later (fleet analytics, violations, etc).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
