import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useMemo, useState } from "react";

export default function CheckoutPage() {
  const { offerId } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();

  const [proceeding, setProceeding] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const seats = Math.max(1, Number(sp.get("seats") || 1));

  const { data, isLoading } = useQuery({
    queryKey: ["offer-public", offerId],
    queryFn: async () => (await api.get(`/api/offers/public/${offerId}`)).data,
  });

  const offer = data?.offer;
  const driver = offer?.driverSnapshot || {};
  const vehicle = offer?.vehicleSnapshot || {};

  const unitPrice = Number(offer?.priceLkr || 0);

  const totalPrice = useMemo(() => {
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return 0;
    if (!Number.isFinite(seats) || seats < 1) return unitPrice;
    return unitPrice * seats;
  }, [unitPrice, seats]);

  async function proceed() {
    try {
      setErrMsg("");
      setProceeding(true);

      const res = await api.post("/api/payments/stripe/session", {
        offerId,
        seatsBooked: seats,
      });

      const url = res?.data?.url;
      if (!url) {
        setErrMsg("Stripe URL missing. Check server /api/payments/stripe/session response.");
        return;
      }

      window.location.assign(url);
    } catch (e) {
      setErrMsg(e?.response?.data?.message || e.message || "Proceed failed");
    } finally {
      setProceeding(false);
    }
  }

  if (isLoading) return <div className="p-8 text-white">Loading…</div>;
  if (!offer) return <div className="p-8 text-white">Offer not found</div>;

  return (
    <div className="min-h-screen bg-[#060812] text-white p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold">Proceed & Checkout</h1>

        <div className="mt-4 space-y-2 text-sm text-white/70">
          <div>
            <b>Route:</b> {offer.origin?.address} → {offer.destination?.address}
          </div>

          <div>
            <b>Pickup:</b>{" "}
            {offer.pickupTime ? new Date(offer.pickupTime).toLocaleString() : "—"}
          </div>

          <div>
            <b>Seats:</b> {seats}
          </div>

          <div>
            <b>Price per ticket:</b> LKR {unitPrice.toLocaleString()}
          </div>

          <div>
            <b>Total payment:</b> LKR {totalPrice.toLocaleString()}
          </div>

          <hr className="my-3 border-white/10" />

          <div>
            <b>Driver:</b> {driver.name || "—"} ({driver.email || "—"})
          </div>

          <div>
            <b>Vehicle:</b> {vehicle.type || "—"} • {vehicle.number || "—"} •{" "}
            {vehicle.color || "—"}
          </div>
        </div>

        {errMsg ? <div className="mt-4 text-sm text-red-300">{errMsg}</div> : null}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => nav(-1)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2"
          >
            Back
          </button>

          <button
            onClick={proceed}
            disabled={proceeding}
            className="rounded-xl bg-white px-4 py-2 font-semibold text-black disabled:opacity-60"
          >
            {proceeding
              ? "Redirecting..."
              : `Proceed to Payment • LKR ${totalPrice.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
}