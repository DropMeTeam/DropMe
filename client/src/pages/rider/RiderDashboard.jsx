import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Link } from "react-router-dom";

export default function RiderDashboard() {
  const { data } = useQuery({
    queryKey: ["my-requests"],
    queryFn: async () => (await api.get("/api/requests/my")).data,
  });

  const { data: bData } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: async () => (await api.get("/api/bookings/my")).data,
  });

  const bookings = bData?.bookings || [];

  function bookingRoute(b) {
    const offer = b.offerId;
    if (offer?.origin?.address || offer?.destination?.address) {
      return `${offer.origin?.address || "Origin"} → ${offer.destination?.address || "Destination"}`;
    }
    const s = b.offerSnapshot || {};
    return `${s.originAddress || "Origin"} → ${s.destinationAddress || "Destination"}`;
  }

  function bookingPickup(b) {
    const offer = b.offerId;
    if (offer?.pickupTime) return new Date(offer.pickupTime).toLocaleString();
    const s = b.offerSnapshot || {};
    if (s.pickupTime) return new Date(s.pickupTime).toLocaleString();
    return "—";
  }

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <div className="text-xl font-semibold">Rider dashboard</div>
        <div className="mt-1 text-sm text-zinc-400">
          Your ride requests and bookings.
        </div>

        <div className="mt-4 flex gap-3">
          <Link to="/plan" className="btn-primary btn">
            Plan a new trip
          </Link>
        </div>
      </div>

      {/* Requests */}
      <div className="card p-6">
        <div className="text-sm font-semibold">Requests</div>
        <div className="mt-3 grid gap-2">
          {(data?.requests || []).map((r) => (
            <div
              key={r._id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4"
            >
              <div className="text-sm font-medium">{r.mode}</div>
              <div className="mt-1 text-xs text-zinc-400">
                {r.origin?.address || "Origin"} → {r.destination?.address || "Destination"}
              </div>
              <div className="mt-1 text-xs text-zinc-400">Status: {r.status}</div>
            </div>
          ))}
          {!data?.requests?.length ? (
            <div className="text-sm text-zinc-400">No requests yet.</div>
          ) : null}
        </div>
      </div>

      {/* My Bookings */}
      <div className="card p-6">
        <div className="text-sm font-semibold">My bookings</div>
        <div className="mt-3 grid gap-2">
          {bookings.map((b) => {
            const route = bookingRoute(b);
            const pickup = bookingPickup(b);

            const canReceipt = b.status === "confirmed" || b.paymentStatus === "paid";

            return (
              <div
                key={b._id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{route}</div>
                    <div className="mt-1 text-xs text-zinc-400">Pickup: {pickup}</div>
                    <div className="mt-1 text-xs text-zinc-400">
                      Seats: {b.seatsBooked} • Status: {b.status}
                      {b.paymentStatus ? ` • Payment: ${b.paymentStatus}` : ""}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <a
                      className={`btn border ${canReceipt ? "" : "opacity-40 pointer-events-none"}`}
                      href={`http://localhost:5000/api/bookings/${b._id}/receipt`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Receipt
                    </a>
                  </div>
                </div>
              </div>
            );
          })}

          {!bookings.length ? (
            <div className="text-sm text-zinc-400">No bookings yet.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}