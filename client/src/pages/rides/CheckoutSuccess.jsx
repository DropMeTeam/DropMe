import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../../lib/api";
import {
  CheckCircle,
  Download,
  LayoutDashboard,
  MapPin,
  Clock,
} from "lucide-react";

function getApiOrigin() {
  const base = api?.defaults?.baseURL || "";
  if (typeof base === "string" && base.startsWith("http")) {
    return base.replace(/\/$/, "");
  }
  return "http://localhost:5000";
}

export default function CheckoutSuccess() {
  const [sp] = useSearchParams();
  const bookingId = sp.get("bookingId") || "";
  const sessionId = sp.get("session_id") || "";

  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("Verifying payment…");
  const [booking, setBooking] = useState(null);
  const [offer, setOffer] = useState(null);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        if (!bookingId || !sessionId) {
          throw new Error("Missing booking or session details");
        }

        const { data } = await api.get("/api/payments/stripe/verify", {
          params: { bookingId, session_id: sessionId },
        });

        if (ignore) return;

        setBooking(data?.booking || null);
        setOffer(data?.offer || null);
        setStatusMsg("Payment Successful");
      } catch (e) {
        if (ignore) return;
        setStatusMsg(e?.response?.data?.message || e?.message || "Verification failed");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [bookingId, sessionId]);

  const apiOrigin = useMemo(() => getApiOrigin(), []);

  const originAddress =
    offer?.origin?.address || booking?.offerSnapshot?.originAddress || "—";

  const destinationAddress =
    offer?.destination?.address || booking?.offerSnapshot?.destinationAddress || "—";

  const pickupTimeRaw =
    offer?.pickupTime || booking?.offerSnapshot?.pickupTime || "";

  const pickupTime = pickupTimeRaw
    ? new Date(pickupTimeRaw).toLocaleString()
    : "—";

  const totalPaid = Number(booking?.amount || 0);

  const receiptUrl = bookingId
    ? `${apiOrigin}/api/bookings/${bookingId}/receipt`
    : "";

  return (
    <div className="min-h-screen bg-[#060812] flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 shadow-[0_0_50px_-10px_rgba(16,185,129,0.4)]">
          <CheckCircle size={48} strokeWidth={2.5} />
        </div>

        <h1 className="mb-2 text-3xl font-bold">{statusMsg}</h1>
        <p className="mb-8 text-white/50">
          {booking
            ? "Your booking is confirmed. See you on the road!"
            : "We could not confirm the payment yet."}
        </p>

        {booking && (
          <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#1ABCFE]">
              Trip Details
            </h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <MapPin className="shrink-0 text-white/30" size={20} />
                <div>
                  <p className="text-xs text-white/40">Route</p>
                  <p className="text-sm font-medium leading-relaxed">
                    {originAddress} <span className="text-[#1ABCFE]">→</span>{" "}
                    {destinationAddress}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-4">
                  <Clock className="shrink-0 text-white/30" size={20} />
                  <div>
                    <p className="text-xs text-white/40">Pickup</p>
                    <p className="text-sm font-medium">{pickupTime}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-white/40">Total Paid</p>
                  <p className="text-lg font-bold text-white">
                    LKR {totalPaid.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          {receiptUrl ? (
            <a
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#1ABCFE] px-8 py-4 font-bold text-black transition-transform hover:scale-105"
              href={receiptUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Download size={18} /> Download Receipt
            </a>
          ) : null}

          <Link
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-bold transition-colors hover:bg-white/10"
            to="/rider"
          >
            <LayoutDashboard size={18} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}