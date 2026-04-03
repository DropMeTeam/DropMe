import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, CreditCard, Loader2 } from "lucide-react";

import StationPicker from "../../components/train/StationPicker";
import SeatSelector from "../../components/train/SeatSelector";
import JourneySummaryCard from "../../components/train/JourneySummaryCard";
import {
  createTrainBooking,
  createTrainStripeSession,
  getTrainScheduleDetails,
} from "../../lib/trainPassengerApi";

// Keep client-side amount aligned with backend.
// This avoids creating a booking that Stripe will reject immediately.
const MIN_TRAIN_PAYMENT_LKR = 200;

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

  if (e < s) {
    e += 24 * 60;
  }

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

  // Enforce minimum total booking amount so Stripe won't reject tiny payments.
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
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/train-service/${id}${day ? `?day=${day}` : ""}`}
          className="inline-flex items-center rounded-2xl border border-zinc-800 px-4 py-2 hover:bg-zinc-900"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to schedule
        </Link>

        <button
          type="button"
          onClick={() => navigate("/train-service/bookings")}
          className="inline-flex items-center rounded-2xl border border-zinc-800 px-4 py-2 hover:bg-zinc-900"
        >
          My bookings
        </button>
      </div>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-6">
        <h1 className="text-2xl font-semibold">Train booking form</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Select your boarding station, destination, date, and seats, then continue to Stripe payment.
        </p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </section>

      <JourneySummaryCard
        trainName={schedule.trainName}
        trainNo={schedule.trainNo}
        boardingName={boardingStation?.name || ""}
        destinationName={destinationStation?.name || ""}
        travelDate={travelDate}
        seats={seats}
        totalFareLkr={totalFareLkr}
        departureTime={boardingStation?.departureTime || ""}
        arrivalTime={destinationStation?.arrivalTime || ""}
        durationLabel={journeyDurationLabel || ""}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-500">Journey distance</div>
          <div className="mt-1 text-lg font-semibold">
            {journeyDistanceKm.toFixed(2)} km
          </div>
          <div className="text-sm text-zinc-400">
            Estimated selected segment distance
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-500">Journey time</div>
          <div className="mt-1 text-lg font-semibold">
            {journeyDurationLabel || "-"}
          </div>
          <div className="text-sm text-zinc-400">
            From selected departure to arrival
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-500">Stored in booking</div>
          <div className="mt-1 text-lg font-semibold">Yes</div>
          <div className="text-sm text-zinc-400">
            Sent in journeySnapshot on checkout
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 rounded-3xl border border-zinc-800 bg-zinc-950/30 p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <StationPicker
            label="Boarding station"
            value={boardingStationId}
            onChange={setBoardingStationId}
            options={stopOptions}
            placeholder="Select boarding station"
            disabled={submitting}
          />

          <StationPicker
            label="Destination station"
            value={destinationStationId}
            onChange={setDestinationStationId}
            options={validDestinationOptions}
            placeholder="Select destination station"
            disabled={submitting || boardingIndex < 0}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-zinc-300">Travel date</label>
            <input
              type="date"
              value={travelDate}
              min={todayLocalDate()}
              onChange={(e) => setTravelDate(e.target.value)}
              disabled={submitting}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">Seats</label>
            <SeatSelector
              value={seats}
              onChange={setSeats}
              min={1}
              max={6}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="text-xs text-zinc-500">Train</div>
            <div className="mt-1 font-medium">
              {schedule.trainName || schedule.trainNo || "-"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="text-xs text-zinc-500">Segments</div>
            <div className="mt-1 font-medium">{segmentCount}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="text-xs text-zinc-500">Distance</div>
            <div className="mt-1 font-medium">{journeyDistanceKm.toFixed(2)} km</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="text-xs text-zinc-500">Fare / seat</div>
            <div className="mt-1 font-medium">LKR {estimatedFarePerSeat.toFixed(2)}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="text-xs text-zinc-500">Total</div>
            <div className="mt-1 font-medium">LKR {totalFareLkr.toFixed(2)}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          A Stripe-safe minimum total of
          <span className="mx-1 font-semibold">LKR {MIN_TRAIN_PAYMENT_LKR}</span>
          is applied for very small bookings so checkout is not rejected.
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="inline-flex items-center rounded-2xl bg-white px-5 py-3 font-medium text-zinc-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to Stripe...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Book now and pay
              </>
            )}
          </button>

          <Link
            to={`/train-service/${id}${day ? `?day=${day}` : ""}`}
            className="inline-flex items-center rounded-2xl border border-zinc-800 px-5 py-3 hover:bg-zinc-900"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}