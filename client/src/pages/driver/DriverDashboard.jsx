import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Link } from "react-router-dom";

export default function DriverDashboard() {
  const { data } = useQuery({
    queryKey: ["my-offers"],
    queryFn: async () => (await api.get("/api/offers/my")).data
  });

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <div className="text-xl font-semibold">Driver dashboard</div>
        <div className="mt-1 text-sm text-zinc-400">Post offers and manage capacity.</div>

        <div className="mt-4">
          <Link to="/driver/offer" className="btn-primary btn">Create a ride offer</Link>
        </div>
      </div>

      <div className="card p-6">
        <div className="text-sm font-semibold">Offers</div>
        <div className="mt-3 grid gap-2">
          {(data?.offers || []).map((o) => (
            <div key={o._id} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
              <div className="text-sm font-medium">Seats: {o.seatsAvailable}/{o.seatsTotal} • {o.status}</div>
              <div className="mt-1 text-xs text-zinc-400">{o.origin.address || "Origin"} → {o.destination.address || "Destination"}</div>
              <div className="mt-1 text-xs text-zinc-400">Pickup: {new Date(o.pickupTime).toLocaleString()}</div>
            </div>
          ))}
          {!data?.offers?.length ? <div className="text-sm text-zinc-400">No offers yet.</div> : null}
        </div>
      </div>
    </div>
  );
}
