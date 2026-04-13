import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../../lib/api";
import { downloadRideReceiptPdf } from "../../lib/rideReceipt";
import {
  CheckCircle,
  Download,
  LayoutDashboard,
  MapPin,
  Clock,
  Loader2,
} from "lucide-react";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function CheckoutSuccess() {
  const [sp] = useSearchParams();
  const bookingId = sp.get("bookingId") || "";
  const sessionId = sp.get("session_id") || "";

  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("Verifying payment…");
  const [booking, setBooking] = useState(null);
  const [offer, setOffer] = useState(null);
  const [verifyError, setVerifyError] = useState("");
  const [receiptBusy, setReceiptBusy] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function verifyWithRetry() {
      if (!bookingId || !sessionId) {
        if (!ignore) {
          setVerifyError("Missing booking or session details");
          setStatusMsg("Verification failed");
          setLoading(false);
        }
        return;
      }

      const maxAttempts = 6;
      let lastMessage = "Verification failed";

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          if (!ignore) {
            setStatusMsg(
              attempt === 1
                ? "Verifying payment…"
                : `Confirming payment… (${attempt}/${maxAttempts})`
            );
          }

          const { data } = await api.get("/api/payments/stripe/verify", {
            params: { bookingId, session_id: sessionId },
          });

          if (ignore) return;

          const nextBooking = data?.booking || null;
          const nextOffer = data?.offer || null;

          const isPaid =
            nextBooking?.paymentStatus === "paid" &&
            nextBooking?.status === "confirmed";

          if (isPaid) {
            setBooking(nextBooking);
            setOffer(nextOffer);
            setVerifyError("");
            setStatusMsg("Payment Successful");
            setLoading(false);
            return;
          }

          lastMessage =
            data?.message || "Payment is still processing. Please wait…";
        } catch (e) {
          if (ignore) return;

          lastMessage =
            e?.response?.data?.message ||
            e?.response?.data?.error ||
            e?.message ||
            "Verification failed";
        }

        if (attempt < maxAttempts) {
          await sleep(2500);
        }
      }

      if (!ignore) {
        setVerifyError(lastMessage);
        setStatusMsg(lastMessage);
        setLoading(false);
      }
    }

    verifyWithRetry();

    return () => {
      ignore = true;
    };
  }, [bookingId, sessionId]);

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

  const isConfirmedAndPaid =
    booking?.paymentStatus === "paid" && booking?.status === "confirmed";

  async function handleReceiptClick() {
    if (!bookingId || receiptBusy) return;
    try {
      setReceiptBusy(true);
      await downloadRideReceiptPdf(bookingId);
    } catch (e) {
      setVerifyError(
        e?.response?.data?.message ||
          e?.message ||
          "Could not download receipt"
      );
    } finally {
      setReceiptBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060812] flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 shadow-[0_0_50px_-10px_rgba(16,185,129,0.4)]">
          {loading ? (
            <Loader2 size={48} strokeWidth={2.5} className="animate-spin" />
          ) : (
            <CheckCircle size={48} strokeWidth={2.5} />
          )}
        </div>

        <h1 className="mb-2 text-3xl font-bold">{statusMsg}</h1>
        <p className="mb-8 text-white/50">
          {isConfirmedAndPaid
            ? "Your booking is confirmed. See you on the road!"
            : loading
            ? "Please wait while we confirm your payment."
            : "We could not confirm the payment yet."}
        </p>

        {isConfirmedAndPaid && (
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

        {!loading && verifyError && !isConfirmedAndPaid ? (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {verifyError}
          </div>
        ) : null}

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          {isConfirmedAndPaid ? (
            <button
              type="button"
              disabled={receiptBusy}
              onClick={handleReceiptClick}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#1ABCFE] px-8 py-4 font-bold text-black transition-transform hover:scale-105 disabled:opacity-60"
            >
              <Download size={18} />{" "}
              {receiptBusy ? "Preparing…" : "Download Receipt"}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-8 py-4 font-bold text-white/50 cursor-not-allowed"
            >
              <Download size={18} /> Receipt not ready
            </button>
          )}

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