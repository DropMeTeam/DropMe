import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useMemo, useState } from "react";
import { ArrowLeft, CreditCard, Users, Calendar, ShieldCheck } from "lucide-react";

export default function CheckoutPage() {
  const { offerId } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();

  const [proceeding, setProceeding] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const seats = Math.max(1, Number(sp.get("seats") || 1));
  const routeDistanceKm = Math.max(0, Number(sp.get("distanceKm") || 0));
  const routeDistanceText =
    routeDistanceKm > 0 ? `${routeDistanceKm.toFixed(1)} km` : "";

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
        routeDistanceKm,
      });

      const url = res?.data?.url;

      if (!url) {
        setErrMsg("Stripe URL missing. Check server response.");
        return;
      }

      window.location.assign(url);
    } catch (e) {
      const status = e?.response?.status;
      const serverMessage =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.response?.data?.details ||
        "";

      if (serverMessage) {
        setErrMsg(serverMessage);
      } else if (status === 409) {
        setErrMsg("This ride cannot be booked right now.");
      } else if (status === 401) {
        setErrMsg("Please log in as a rider to continue.");
      } else if (status === 403) {
        setErrMsg("You are not allowed to make this payment.");
      } else if (status === 404) {
        setErrMsg("Ride offer not found.");
      } else {
        setErrMsg(e?.message || "Proceed failed");
      }
    } finally {
      setProceeding(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060812]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1ABCFE] border-t-transparent"></div>
      </div>
    );
  }

  if (!offer) {
    return <div className="p-8 text-center text-white">Offer not found</div>;
  }

  return (
    <div className="min-h-screen bg-[#060812] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#1ABCFE]/10 via-transparent to-transparent p-6 text-white font-sans">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => nav(-1)}
          className="mb-6 flex items-center gap-2 text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft size={20} /> Back to Search
        </button>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <h1 className="flex items-center gap-3 text-2xl font-bold">
                <ShieldCheck className="text-[#1ABCFE]" /> Confirm Your Ride
              </h1>

              <div className="mt-8 space-y-6">
                <div className="relative space-y-8 border-l-2 border-dashed border-white/20 pl-8">
                  <div className="relative">
                    <div className="absolute -left-10 top-1 h-4 w-4 rounded-full bg-[#1ABCFE] shadow-[0_0_10px_#1ABCFE]"></div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-white/50">
                      Origin
                    </p>
                    <p className="text-lg font-medium">{offer.origin?.address}</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-10 top-1 h-4 w-4 rounded-full bg-white/40"></div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-white/50">
                      Destination
                    </p>
                    <p className="text-lg font-medium">
                      {offer.destination?.address}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <Calendar className="mb-2 text-white/40" size={20} />
                    <p className="text-xs text-white/40">Pickup Time</p>
                    <p className="font-medium">
                      {offer.pickupTime
                        ? new Date(offer.pickupTime).toLocaleString()
                        : "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <Users className="mb-2 text-white/40" size={20} />
                    <p className="text-xs text-white/40">Seats Requested</p>
                    <p className="font-medium">{seats} Person(s)</p>
                  </div>
                </div>
              </div>

              <hr className="my-8 border-white/10" />

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1ABCFE]/20 text-xl font-bold uppercase text-[#1ABCFE]">
                  {driver.name?.charAt(0) || "D"}
                </div>

                <div>
                  <p className="text-sm uppercase tracking-wider text-white/50">
                    Driver & Vehicle
                  </p>
                  <p className="text-lg font-semibold">{driver.name || "—"}</p>
                  <p className="text-sm text-white/60">
                    {vehicle.type || "—"} •{" "}
                    <span className="text-[#1ABCFE]">
                      {vehicle.number || "—"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="sticky top-6 rounded-3xl border border-[#1ABCFE]/30 bg-[#1ABCFE]/5 p-6 backdrop-blur-xl shadow-[0_0_40px_-15px_rgba(26,188,254,0.3)]">
              <h2 className="mb-6 text-lg font-bold">Payment Summary</h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-white/70">
                  <span>Unit Price</span>
                  <span>LKR {unitPrice.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-white/70">
                  <span>Quantity</span>
                  <span>x {seats}</span>
                </div>

                {routeDistanceText && (
                  <div className="flex justify-between text-white/70">
                    <span>Est. Distance</span>
                    <span>{routeDistanceText}</span>
                  </div>
                )}

                <div className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-4">
                  <span className="text-lg font-bold">Total</span>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-[#1ABCFE]">
                      LKR {totalPrice.toLocaleString()}
                    </p>
                    <p className="text-[10px] uppercase tracking-tighter text-white/40">
                      All taxes included
                    </p>
                  </div>
                </div>
              </div>

              {errMsg && (
                <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs text-red-400">
                  {errMsg}
                </div>
              )}

              <button
                onClick={proceed}
                disabled={proceeding}
                className="group relative mt-8 w-full overflow-hidden rounded-2xl bg-white px-6 py-4 font-bold text-black transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  <CreditCard size={18} />
                  {proceeding ? "Processing..." : "Pay Now"}
                </div>
              </button>

              <p className="mt-4 text-center text-[11px] text-white/30">
                Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}