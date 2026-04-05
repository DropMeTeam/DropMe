import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  createTrainBooking,
  createTrainStripeSession,
  getTrainScheduleDetails,
} from "../../lib/trainPassengerApi";

import CheckoutHeaderBar from "./components/checkout/CheckoutHeaderBar";
import CheckoutRouteCard from "./components/checkout/CheckoutRouteCard";
import CheckoutMetricsGrid from "./components/checkout/CheckoutMetricsGrid";
import CheckoutPreferencesSection from "./components/checkout/CheckoutPreferencesSection";
import CheckoutInvoiceSidebar from "./components/checkout/CheckoutInvoiceSidebar";

const MIN_TRAIN_PAYMENT_LKR = 200;

// Change this if your actual search page route is different.
const SEARCH_PAGE_PATH = "/train-service/search";

function todayLocalDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function hhmmToMinutes(value) {
  if (!value || typeof value !== "string" || !value.includes(":")) return 0;

  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;

  return h * 60 + m;
}

function diffMinutes(start, end) {
  let s = hhmmToMinutes(start);
  let e = hhmmToMinutes(end);

  if (e < s) e += 24 * 60;

  return Math.max(0, e - s);
}

function minutesToLabel(totalMinutes) {
  const mins = Math.max(0, Number(totalMinutes || 0));
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export default function TrainCheckoutPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const day = searchParams.get("day") || "";
  const presetFromStationId = searchParams.get("fromStationId") || "";
  const presetToStationId = searchParams.get("toStationId") || "";

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [travelDate, setTravelDate] = useState(todayLocalDate());
  const [boardingStationId, setBoardingStationId] = useState("");
  const [destinationStationId, setDestinationStationId] = useState("");
  const [seats, setSeats] = useState(1);

  useEffect(() => {
    let mounted = true;

    async function loadSchedule() {
      setLoading(true);
      setError("");

      try {
        const data = await getTrainScheduleDetails(id, day ? { day } : {});
        const nextSchedule = data?.schedule || null;

        if (!mounted) return;

        setSchedule(nextSchedule);

        const nextStops = Array.isArray(nextSchedule?.stops)
          ? nextSchedule.stops
              .filter((stop) => stop?.station?._id)
              .map((stop) => ({
                _id: String(stop.station._id),
                name: stop.station.name || "Unknown station",
                order: safeNumber(stop.order, 0),
                arrivalTime: stop.arrivalTime || "",
                departureTime: stop.departureTime || "",
              }))
              .sort((a, b) => a.order - b.order)
          : [];

        if (nextStops.length > 0) {
          const defaultFrom =
            nextStops.find((s) => s._id === presetFromStationId)?._id ||
            nextStops[0]._id;

          const defaultTo =
            nextStops.find((s) => s._id === presetToStationId)?._id ||
            nextStops[nextStops.length - 1]._id;

          setBoardingStationId(defaultFrom);
          setDestinationStationId(
            defaultFrom === defaultTo && nextStops.length > 1
              ? nextStops[nextStops.length - 1]._id
              : defaultTo
          );
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || "Failed to load checkout details");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSchedule();

    return () => {
      mounted = false;
    };
  }, [id, day, presetFromStationId, presetToStationId]);

  const stopOptions = useMemo(() => {
    const rawStops = Array.isArray(schedule?.stops) ? schedule.stops : [];

    return rawStops
      .filter((stop) => stop?.station?._id)
      .map((stop) => ({
        _id: String(stop.station._id),
        name: stop.station.name || "Unknown station",
        order: safeNumber(stop.order, 0),
        arrivalTime: stop.arrivalTime || "",
        departureTime: stop.departureTime || "",
      }))
      .sort((a, b) => a.order - b.order);
  }, [schedule]);

  const boardingStation = useMemo(
    () => stopOptions.find((s) => s._id === boardingStationId) || null,
    [stopOptions, boardingStationId]
  );

  const destinationStation = useMemo(
    () => stopOptions.find((s) => s._id === destinationStationId) || null,
    [stopOptions, destinationStationId]
  );

  const boardingIndex = useMemo(
    () => stopOptions.findIndex((s) => s._id === boardingStationId),
    [stopOptions, boardingStationId]
  );

  const destinationIndex = useMemo(
    () => stopOptions.findIndex((s) => s._id === destinationStationId),
    [stopOptions, destinationStationId]
  );

  const validDestinationOptions = useMemo(() => {
    if (boardingIndex < 0) return stopOptions;
    return stopOptions.filter((_, index) => index > boardingIndex);
  }, [stopOptions, boardingIndex]);

  useEffect(() => {
    if (!destinationStationId) return;
    if (boardingIndex < 0 || destinationIndex < 0) return;

    if (destinationIndex <= boardingIndex) {
      const firstValid = stopOptions.find((_, index) => index > boardingIndex);
      setDestinationStationId(firstValid?._id || "");
    }
  }, [boardingIndex, destinationIndex, destinationStationId, stopOptions]);

  const segmentCount = useMemo(() => {
    if (boardingIndex < 0 || destinationIndex < 0) return 0;
    return Math.max(0, destinationIndex - boardingIndex);
  }, [boardingIndex, destinationIndex]);

  const journeyDurationMinutes = useMemo(() => {
    if (!boardingStation?.departureTime || !destinationStation?.arrivalTime) {
      return 0;
    }

    return diffMinutes(
      boardingStation.departureTime,
      destinationStation.arrivalTime
    );
  }, [boardingStation, destinationStation]);

  const journeyDurationLabel = useMemo(() => {
    return minutesToLabel(journeyDurationMinutes);
  }, [journeyDurationMinutes]);

  const journeyDistanceKm = useMemo(() => {
    if (!schedule || segmentCount <= 0) return 0;

    const totalDistanceKm = safeNumber(schedule.totalDistanceKm, 0);
    const totalSegments = Math.max(1, stopOptions.length - 1);

    return Number(
      (totalDistanceKm * (segmentCount / totalSegments)).toFixed(2)
    );
  }, [schedule, stopOptions.length, segmentCount]);

  const estimatedFarePerSeat = useMemo(() => {
    if (!schedule || segmentCount <= 0) return 0;

    const totalDistanceKm = safeNumber(schedule.totalDistanceKm, 0);
    const totalSegments = Math.max(1, stopOptions.length - 1);
    const segmentRatio = segmentCount / totalSegments;

    if (totalDistanceKm > 0) {
      return Math.max(100, Math.round(totalDistanceKm * segmentRatio * 12));
    }

    return Math.max(100, segmentCount * 120);
  }, [schedule, stopOptions.length, segmentCount]);

  const totalFareLkr = useMemo(() => {
    const computedTotal = estimatedFarePerSeat * safeNumber(seats, 1);
    return Math.max(MIN_TRAIN_PAYMENT_LKR, computedTotal);
  }, [estimatedFarePerSeat, seats]);

  const canSubmit =
    !!schedule &&
    !!boardingStation &&
    !!destinationStation &&
    !!travelDate &&
    segmentCount > 0 &&
    seats > 0 &&
    totalFareLkr >= MIN_TRAIN_PAYMENT_LKR;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");

    try {
      const bookingRes = await createTrainBooking({
        scheduleId: schedule._id,
        boardingStationId: boardingStation._id,
        boardingStationName: boardingStation.name,
        destinationStationId: destinationStation._id,
        destinationStationName: destinationStation.name,
        travelDate,
        seats,
        totalFareLkr,
        journeySnapshot: {
          trainNo: schedule.trainNo || "",
          trainName: schedule.trainName || "",
          departureTime: boardingStation.departureTime || "",
          arrivalTime: destinationStation.arrivalTime || "",
          durationLabel: journeyDurationLabel || "",
          durationMinutes: journeyDurationMinutes || 0,
          distanceKm: journeyDistanceKm || 0,
        },
      });

      const bookingId = bookingRes?.booking?._id;

      if (!bookingId) {
        throw new Error("Booking was created but booking id is missing");
      }

      const paymentRes = await createTrainStripeSession(bookingId);

      if (!paymentRes?.url) {
        throw new Error("Stripe session URL not returned");
      }

      window.location.href = paymentRes.url;
    } catch (e2) {
      console.error("Train booking/payment error:", e2?.response?.data || e2);

      setError(
        e2?.response?.data?.message ||
          e2?.response?.data?.error ||
          e2?.message ||
          "Failed to start train booking"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-zinc-400">Loading booking form...</div>;
  }

  if (error && !schedule) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
        {error}
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-6 text-zinc-400">
        Schedule not found.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <CheckoutHeaderBar
        title="Complete Booking"
        searchPath={SEARCH_PAGE_PATH}
        onBookingsClick={() => navigate("/train-service/bookings")}
      />

      {error ? (
        <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <CheckoutRouteCard
            trainName={schedule.trainName}
            trainNo={schedule.trainNo}
            boardingName={boardingStation?.name || ""}
            destinationName={destinationStation?.name || ""}
            departureTime={boardingStation?.departureTime || ""}
            arrivalTime={destinationStation?.arrivalTime || ""}
          />

          <CheckoutMetricsGrid
            trainName={schedule.trainName || schedule.trainNo || "-"}
            trainNo={schedule.trainNo || "-"}
            segmentCount={segmentCount}
            journeyDistanceKm={journeyDistanceKm}
            journeyDurationLabel={journeyDurationLabel}
          />

          <CheckoutPreferencesSection
            stopOptions={stopOptions}
            validDestinationOptions={validDestinationOptions}
            boardingStationId={boardingStationId}
            onBoardingChange={setBoardingStationId}
            destinationStationId={destinationStationId}
            onDestinationChange={setDestinationStationId}
            travelDate={travelDate}
            onTravelDateChange={setTravelDate}
            seats={seats}
            onSeatsChange={setSeats}
            minDate={todayLocalDate()}
            minPaymentLkr={MIN_TRAIN_PAYMENT_LKR}
            submitting={submitting}
            boardingIndex={boardingIndex}
          />
        </div>

        <CheckoutInvoiceSidebar
          trainName={schedule.trainName || "Train service"}
          trainNo={schedule.trainNo || ""}
          boardingName={boardingStation?.name || ""}
          destinationName={destinationStation?.name || ""}
          departureTime={boardingStation?.departureTime || ""}
          arrivalTime={destinationStation?.arrivalTime || ""}
          travelDate={travelDate}
          seats={seats}
          farePerSeat={estimatedFarePerSeat}
          totalFareLkr={totalFareLkr}
          canSubmit={canSubmit}
          submitting={submitting}
          cancelPath={SEARCH_PAGE_PATH}
        />
      </div>
    </form>
  );
}
