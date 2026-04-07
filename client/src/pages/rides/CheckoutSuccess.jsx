import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../../lib/api";

export default function CheckoutSuccess() {
  const [sp] = useSearchParams();
  const bookingId = sp.get("bookingId");
  const sessionId = sp.get("session_id");
  const [msg, setMsg] = useState("Verifying payment…");

  useEffect(() => {
    (async () => {
      try {
        await api.get("/api/payments/stripe/verify", {
          params: { bookingId, session_id: sessionId },
        });
        setMsg("Payment successful ✅ Booking confirmed.");
      } catch (e) {
        setMsg(e?.response?.data?.message || "Verification failed");
      }
    })();
  }, [bookingId, sessionId]);

  return (
    <div className="min-h-screen bg-[#060812] text-white p-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">{msg}</div>

        <div className="mt-4 flex gap-3">
          {bookingId ? (
            <a
              className="rounded-xl bg-white text-black px-4 py-2 font-semibold"
              href={`http://localhost:5000/api/bookings/${bookingId}/receipt`}
              target="_blank"
              rel="noreferrer"
            >
              Download Receipt
            </a>
          ) : null}

          <Link className="rounded-xl border border-white/10 bg-white/5 px-4 py-2" to="/rider">
            Go to Rider Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}