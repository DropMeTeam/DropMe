import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  getMyTrainBookings,
  cancelMyTrainBooking,
  verifyTrainStripePayment,
} from "../../lib/trainPassengerApi";

import BookingsHeroSection from "./components/bookings/BookingsHeroSection";
import BookingsStatsGrid from "./components/bookings/BookingsStatsGrid";
import BookingsStatusBanner from "./components/bookings/BookingsStatusBanner";
import BookingsJourneyList from "./components/bookings/BookingsJourneyList";
import {
  getActiveTickets,
  getMilesTravelled,
} from "./components/bookings/bookings.utils";

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

    const ok = window.confirm("Are you sure you want to cancel this booking?");
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

  const totalJourneys = bookings.length;

  const activeTickets = useMemo(() => getActiveTickets(bookings), [bookings]);
  const milesTravelled = useMemo(() => getMilesTravelled(bookings), [bookings]);

  return (
  <div className="mx-auto w-full max-w-[1500px] px-6 py-2 md:px-8 xl:px-10">
  <div className="grid gap-5">
      <BookingsHeroSection onRefresh={handleRefresh} busy={loading || verifying} />

      <BookingsStatsGrid
        totalJourneys={totalJourneys}
        activeTickets={activeTickets}
        milesTravelled={milesTravelled}
      />

      {verifying ? (
        <BookingsStatusBanner
          variant="info"
          title="Verifying Payment"
          message="We are checking your Stripe payment and updating the latest booking state."
        />
      ) : null}

      {message ? (
        <BookingsStatusBanner
          variant="success"
          title="Payment Successful"
          message={message}
        />
      ) : null}

      {error ? (
        <BookingsStatusBanner
          variant="error"
          title="Something went wrong"
          message={error}
        />
      ) : null}

      <BookingsJourneyList
        bookings={bookings}
        loading={loading}
        cancellingId={cancellingId}
        onCancel={handleCancel}
      />
    </div>
  </div>
);
}
