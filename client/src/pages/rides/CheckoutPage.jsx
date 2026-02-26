import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export default function CheckoutPage() {
  const { offerId } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();

  const seats = Math.max(1, Number(sp.get("seats") || 1));

  const { data, isLoading } = useQuery({
    queryKey: ["offer-public", offerId],
    queryFn: async () => (await api.get(`/api/offers/public/${offerId}`)).data,
  });

  const offer = data?.offer;
  const driver = offer?.driverSnapshot || {};
  const vehicle = offer?.vehicleSnapshot || {};

  async function proceed() {
    // backend should create session + pending booking
    const res = await api.post("/api/payments/stripe/session", {
      offerId,
      seatsBooked: seats,
    });
    window.location.href = res.data.url;
  }

  if (isLoading) return <div className="p-8 text-white">Loading…</div>;
  if (!offer) return <div className="p-8 text-white">Offer not found</div>;

  return (
    <div className="min-h-screen bg-[#060812] text-white p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold">Proceed & Checkout</h1>

        <div className="mt-4 text-sm text-white/70 space-y-2">
          <div><b>Route:</b> {offer.origin?.address} → {offer.destination?.address}</div>
          <div><b>Pickup:</b> {offer.pickupTime ? new Date(offer.pickupTime).toLocaleString() : "—"}</div>
          <div><b>Seats:</b> {seats}</div>
          <div><b>Price:</b> LKR {offer.priceLkr}</div>

          <hr className="my-3 border-white/10" />

          <div><b>Driver:</b> {driver.name || "—"} ({driver.email || "—"})</div>
          <div><b>Vehicle:</b> {vehicle.type || "—"} • {vehicle.number || "—"} • {vehicle.color || "—"}</div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={() => nav(-1)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
            Back
          </button>
          <button onClick={proceed} className="rounded-xl bg-white text-black px-4 py-2 font-semibold">
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}