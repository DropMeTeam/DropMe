import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { CheckCircle, Download, LayoutDashboard, MapPin, Clock } from "lucide-react";

export default function CheckoutSuccess() {
  const [sp] = useSearchParams();
  const bookingId = sp.get("bookingId");
  const sessionId = sp.get("session_id");
  const [statusMsg, setStatusMsg] = useState("Verifying payment…");

  // Fetch booking details to display on success
  const { data: bookingData } = useQuery({
    queryKey: ["booking-receipt", bookingId],
    queryFn: async () => (await api.get(`/api/bookings/my-bookings`)).data, // Using existing endpoint
    enabled: !!bookingId,
  });

  const booking = bookingData?.bookings?.find(b => b._id === bookingId);
  const offer = booking?.offerId;

  useEffect(() => {
    (async () => {
      try {
        await api.get("/api/payments/stripe/verify", {
          params: { bookingId, session_id: sessionId },
        });
        setStatusMsg("Payment Successful");
      } catch (e) {
        setStatusMsg(e?.response?.data?.message || "Verification failed");
      }
    })();
  }, [bookingId, sessionId]);

  return (
    <div className="min-h-screen bg-[#060812] flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-xl text-center">
        {/* Animated Checkmark */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 shadow-[0_0_50px_-10px_rgba(16,185,129,0.4)]">
          <CheckCircle size={48} strokeWidth={2.5} />
        </div>

        <h1 className="text-3xl font-bold mb-2">{statusMsg}</h1>
        <p className="text-white/50 mb-8">Your booking is confirmed. See you on the road!</p>

        {/* Details Card */}
        {booking && (
          <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[#1ABCFE] mb-4">Trip Details</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <MapPin className="text-white/30 shrink-0" size={20} />
                <div>
                  <p className="text-xs text-white/40">Route</p>
                  <p className="text-sm font-medium leading-relaxed">
                    {offer?.origin?.address} <span className="text-[#1ABCFE]">→</span> {offer?.destination?.address}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-4">
                  <Clock className="text-white/30 shrink-0" size={20} />
                  <div>
                    <p className="text-xs text-white/40">Pickup</p>
                    <p className="text-sm font-medium">
                      {offer?.pickupTime ? new Date(offer.pickupTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "—"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/40">Total Paid</p>
                  <p className="text-lg font-bold text-white">
                    LKR {booking.amount?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {bookingId && (
            <a
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#1ABCFE] px-8 py-4 font-bold text-black transition-transform hover:scale-105"
              href={`http://localhost:5000/api/bookings/${bookingId}/receipt`}
              target="_blank"
              rel="noreferrer"
            >
              <Download size={18} /> Download Receipt
            </a>
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