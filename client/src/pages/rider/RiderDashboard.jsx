import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Link } from "react-router-dom";

export default function RiderDashboard() {
  const { data } = useQuery({
    queryKey: ["my-requests"],
    queryFn: async () => (await api.get("/api/requests/my")).data
  });

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <div className="text-xl font-semibold">Rider dashboard</div>
        <div className="mt-1 text-sm text-zinc-400">Your recent ride requests.</div>

        <div className="mt-4">
          <Link to="/plan" className="btn-primary btn">Plan a new trip</Link>
        </div>
      </div>

      <div className="card p-6">
        <div className="text-sm font-semibold">Requests</div>
        <div className="mt-3 grid gap-2">
          {(data?.requests || []).map((r) => (
            <div key={r._id} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
              <div className="text-sm font-medium">{r.mode}</div>
              <div className="mt-1 text-xs text-zinc-400">{r.origin.address || "Origin"} → {r.destination.address || "Destination"}</div>
              <div className="mt-1 text-xs text-zinc-400">Status: {r.status}</div>
            </div>
          ))}
          {!data?.requests?.length ? <div className="text-sm text-zinc-400">No requests yet.</div> : null}
        </div>
      </div>
    </div>
  );
}
