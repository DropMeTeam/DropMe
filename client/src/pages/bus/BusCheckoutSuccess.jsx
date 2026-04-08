import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../../lib/api";

function shortLabel(label = "") {
  return String(label).split(",")[0].trim();
}

export default function BusCheckoutSuccess() {
  const [sp] = useSearchParams();
  const bookingId = sp.get("bookingId");
  const sessionId = sp.get("session_id");

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("Verifying payment...");
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/payments/stripe/bus/verify", {
          params: { bookingId, session_id: sessionId },
        });

        setBooking(data?.booking || null);
        setMsg("Payment successful. Bus ticket confirmed.");
      } catch (e) {
        setMsg(e?.response?.data?.message || "Verification failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId, sessionId]);

  return (
    <div className="min-h-screen bg-[#060812] px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
          <h1 className="text-2xl font-semibold">Bus Ticket Receipt</h1>
          <p className="mt-2 text-white/60">{msg}</p>

          {loading ? (
            <div className="mt-6 text-sm text-white/60">Please wait...</div>
          ) : booking ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <ReceiptRow label="Booking ID" value={booking._id} />
              <ReceiptRow label="Travel Date" value={booking.travelDate} />
              <ReceiptRow
                label="Bus"
                value={`${booking?.journeySnapshot?.busNumber || "-"} (${booking?.journeySnapshot?.busType || "-"})`}
              />
              <ReceiptRow
                label="Route No"
                value={booking?.journeySnapshot?.routeNumber || "-"}
              />
              <ReceiptRow
                label="Pickup"
                value={`${shortLabel(booking?.pickupStop?.label)} ${booking?.pickupStop?.time ? `• ${booking.pickupStop.time}` : ""}`}
              />
              <ReceiptRow
                label="Dropoff"
                value={`${shortLabel(booking?.dropoffStop?.label)} ${booking?.dropoffStop?.time ? `• ${booking.dropoffStop.time}` : ""}`}
              />
              <ReceiptRow
                label="Seats"
                value={(booking?.seatNumbers || []).join(", ")}
              />
              <ReceiptRow
                label="Distance"
                value={`${Number(booking?.journeySnapshot?.passengerDistanceKm || 0).toFixed(1)} km`}
              />
              <ReceiptRow
                label="Fare / seat"
                value={`LKR ${Number(booking?.farePerSeatLkr || 0).toLocaleString()}`}
              />
              <ReceiptRow
                label="Total"
                value={`LKR ${Number(booking?.totalAmountLkr || 0).toLocaleString()}`}
              />
              <ReceiptRow
                label="Booking Status"
                value={booking?.bookingStatus || "-"}
              />
              <ReceiptRow
                label="Payment Status"
                value={booking?.paymentStatus || "-"}
              />
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/bus-booking"
              className="rounded-xl bg-white px-4 py-2 font-semibold text-black"
            >
              Back to Bus Booking
            </Link>

            <Link
              to="/rider"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2"
            >
              Go to Rider Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.22em] text-white/35">{label}</div>
      <div className="mt-2 text-sm font-semibold text-white break-all">{value || "-"}</div>
    </div>
  );
}