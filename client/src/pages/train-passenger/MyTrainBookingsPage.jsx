import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ReceiptText, TrainFront, RefreshCw } from "lucide-react";

import BookingCard from "../../components/train/BookingCard";
import {
  getMyTrainBookings,
  cancelMyTrainBooking,
  verifyTrainStripePayment,
} from "../../lib/trainPassengerApi";

export default function MyTrainBookingsPage() {
  const [searchParams] = useSearchParams();

  const payment = searchParams.get("payment") || "";
  const bookingId = searchParams.get("bookingId") || "";
  const sessionId = searchParams.get("session_id") || "";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [cancellingId, setCancellingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadBookings() {
    setLoading(true);
    setError("");

    try {
      const data = await getMyTrainBookings();
      setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load train bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function runVerifyIfNeeded() {
    if (payment !== "success" || !bookingId || !sessionId) {
      if (payment === "cancelled") {
        setMessage("Payment was cancelled. Your booking is still unpaid or pending.");
      }
      return;
    }

    setVerifying(true);
    setError("");

    try {
      await verifyTrainStripePayment({
        bookingId,
        sessionId,
      });

      setMessage("Payment verified successfully. Your train booking is now confirmed.");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to verify train payment");
    } finally {
      setVerifying(false);
    }
  }

  async function handleCancel(booking) {
    const id = booking?._id;
    if (!id) return;

    const ok = window.confirm(
      "Are you sure you want to cancel this booking?"
    );
    if (!ok) return;

    setCancellingId(id);
    setError("");

    try {
      await cancelMyTrainBooking(id);
      setMessage("Booking cancelled successfully.");
      await loadBookings();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancellingId("");
    }
  }

  async function handleRefresh() {
    await loadBookings();
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!mounted) return;

      await runVerifyIfNeeded();
      if (!mounted) return;

      await loadBookings();
    }

    init();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-950">
              <ReceiptText className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold">My train bookings</h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                View your bookings, verify Stripe payments, and manage unpaid reservations.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || verifying}
              className="inline-flex items-center rounded-2xl border border-zinc-800 px-4 py-2 hover:bg-zinc-900 disabled:opacity-60"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </button>

            <Link
              to="/train-service"
              className="inline-flex items-center rounded-2xl border border-zinc-800 px-4 py-2 hover:bg-zinc-900"
            >
              <TrainFront className="mr-2 h-4 w-4" />
              Back to train search
            </Link>
          </div>
        </div>

        {verifying ? (
          <div className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-200">
            Verifying Stripe payment...
          </div>
        ) : null}

        {message ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4">
        {loading ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-6 text-sm text-zinc-400">
            Loading your bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-6 text-sm text-zinc-400">
            No train bookings found yet.
          </div>
        ) : (
          bookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              onCancel={handleCancel}
              cancelling={cancellingId === booking._id}
            />
          ))
        )}
      </section>
    </div>
  );
}