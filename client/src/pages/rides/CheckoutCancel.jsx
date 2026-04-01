import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../../lib/api";

export default function CheckoutCancel() {
  const [sp] = useSearchParams();
  const bookingId = sp.get("bookingId");
  const [msg, setMsg] = useState("Cancelling…");

  useEffect(() => {
    (async () => {
      try {
        if (bookingId) await api.post(`/api/bookings/${bookingId}/cancel`);
        setMsg("Checkout cancelled. Seats released.");
      } catch (e) {
        setMsg(e?.response?.data?.message || "Cancel failed");
      }
    })();
  }, [bookingId]);

  return (
    <div className="min-h-screen bg-[#060812] text-white p-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">{msg}</div>
        <div className="mt-4">
          <Link className="rounded-xl border border-white/10 bg-white/5 px-4 py-2" to="/plan">
            Back to Plan
          </Link>
        </div>
      </div>
    </div>
  );
}