import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BusFront,
  CalendarDays,
  MapPin,
  Ticket,
  Users,
  LayoutGrid,
  Sparkles,
  Route as RouteIcon,
  CreditCard,
  Loader2,
} from "lucide-react";
import { api } from "../../lib/api";
import { calculateBusFare, formatLkr } from "../../lib/busFare";
import { getBusLayoutType } from "../../lib/busSeatLayout";
import BusSeatLayoutPreview from "../../components/bus/BusSeatLayoutPreview";

function shortLabel(label = "") {
  return String(label).split(",")[0].trim();
}

function normalizeSeatList(value) {
  return Array.isArray(value)
    ? value.map((seat) => String(seat).trim().toUpperCase()).filter(Boolean)
    : [];
}

function mapPaymentErrorMessage(error) {
  const rawMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Proceed to payment failed";

  if (
    /at least 50 cents/i.test(rawMessage) ||
    /converts to approximately/i.test(rawMessage)
  ) {
    return "This ticket amount is too low for Stripe checkout. Increase the fare or use another payment method.";
  }

  return rawMessage;
}

export default function BusBookingDetailsPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const bus = state?.bus || null;
  const route = state?.route || null;
  const schedule = state?.schedule || null;
  const searchData = state?.searchData || null;

  const pickupLabel = route?.fromMatch?.label || searchData?.from?.label || "";
  const dropoffLabel = route?.toMatch?.label || searchData?.to?.label || "";

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [pendingSeats, setPendingSeats] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [proceeding, setProceeding] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  if (!bus || !route || !searchData || !schedule) {
    return (
      <div className="min-h-screen bg-[#060812] px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <h1 className="text-2xl font-semibold">Booking details unavailable</h1>
          <p className="mt-2 text-white/60">
            Open this page by selecting a bus from the bus booking flow.
          </p>

          <button
            onClick={() => navigate("/buses/search")}
            className="mt-6 rounded-xl bg-white px-5 py-3 font-medium text-black"
          >
            Back to Bus Booking
          </button>
        </div>
      </div>
    );
  }

  const computedFare = calculateBusFare({
    busType: bus.busType,
    distanceKm: state?.passengerDistanceKm ?? route?.passengerDistanceKm ?? 0,
  });

  const seatLayoutType =
    state?.seatLayoutType ||
    getBusLayoutType(bus.busType, Number(bus?.seatsTotal || 0));

  const totalAmount = computedFare.fareLkr * selectedSeats.length;

  const reservedSeats = useMemo(
    () => [...new Set([...bookedSeats, ...pendingSeats])],
    [bookedSeats, pendingSeats]
  );

  const selectedReservedSeat = useMemo(
    () => selectedSeats.find((seat) => reservedSeats.includes(seat)),
    [selectedSeats, reservedSeats]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      try {
        setAvailabilityLoading(true);
        setAvailabilityError("");

        const { data } = await api.get("/api/bus/bookings/availability", {
          params: {
            scheduleId: schedule?._id,
            travelDate: searchData?.date,
            pickupLabel,
            dropoffLabel,
          },
        });

        if (cancelled) return;

        const nextBookedSeats = normalizeSeatList(data?.bookedSeats);
        const nextPendingSeats = normalizeSeatList(data?.pendingSeats);
        const nextReservedSeats = [...new Set([...nextBookedSeats, ...nextPendingSeats])];

        setBookedSeats(nextBookedSeats);
        setPendingSeats(nextPendingSeats);

        setSelectedSeats((prev) =>
          prev.filter(
            (seat) => !nextReservedSeats.includes(String(seat).trim().toUpperCase())
          )
        );
      } catch (error) {
        if (cancelled) return;
        setAvailabilityError(
          error?.response?.data?.message || "Failed to load seat availability"
        );
        setBookedSeats([]);
        setPendingSeats([]);
      } finally {
        if (!cancelled) {
          setAvailabilityLoading(false);
        }
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [schedule?._id, searchData?.date, pickupLabel, dropoffLabel]);

  function handleSeatToggle(seatNo) {
    const normalizedSeatNo = String(seatNo).trim().toUpperCase();

    if (reservedSeats.includes(normalizedSeatNo)) return;

    setSelectedSeats((prev) =>
      prev.includes(normalizedSeatNo)
        ? prev.filter((item) => item !== normalizedSeatNo)
        : [...prev, normalizedSeatNo]
    );
  }

  async function handleProceedToPayment() {
    if (!selectedSeats.length) {
      alert("Please select at least one seat.");
      return;
    }

    if (selectedReservedSeat) {
      setErrMsg(`Seat ${selectedReservedSeat} is no longer available.`);
      return;
    }

    try {
      setErrMsg("");
      setProceeding(true);

      const checkoutRes = await api.post("/api/bus/bookings/checkout", {
        scheduleId: schedule._id,
        travelDate: searchData.date,
        pickupLabel,
        dropoffLabel,
        seatNumbers: selectedSeats,
      });

      const bookingId = checkoutRes?.data?.booking?._id;
      if (!bookingId) {
        setErrMsg("Bus booking was not created correctly.");
        return;
      }

      const paymentRes = await api.post("/api/payments/stripe/bus/session", {
        bookingId,
      });

      const url = paymentRes?.data?.url;
      if (!url) {
        setErrMsg(
          "Stripe URL missing. Check server /api/payments/stripe/bus/session response."
        );
        return;
      }

      window.location.assign(url);
    } catch (error) {
      setErrMsg(mapPaymentErrorMessage(error));
    } finally {
      setProceeding(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060812] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
          <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,24,0.96)_0%,rgba(4,7,15,0.98)_100%)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <BusFront className="h-7 w-7 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold">Booking Details</h1>
                <p className="mt-1 text-sm text-white/60">
                  Review bus, route, journey, and fare details before payment.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <InfoRow
                icon={<BusFront className="h-4 w-4" />}
                label="Bus No"
                value={bus?.plateNumber || "-"}
              />

              <FeatureBlock features={bus?.features || []} />

              <InfoRow
                icon={<RouteIcon className="h-4 w-4" />}
                label="Route No"
                value={route?.routeNumber || "-"}
              />

              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Route"
                value={`${shortLabel(route?.start?.label)} -> ${shortLabel(route?.end?.label)}`}
              />

              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Travel date"
                value={searchData?.date || "-"}
              />

              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Passenger journey"
                value={`${shortLabel(pickupLabel)} -> ${shortLabel(dropoffLabel)}`}
              />

              <InfoRow
                icon={<Users className="h-4 w-4" />}
                label="Available seats"
                value={`${bus?.seatsTotal || 0}`}
              />

              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Passenger distance"
                value={`${computedFare.distanceKm} km`}
              />

              <InfoRow
                icon={<Ticket className="h-4 w-4" />}
                label="Ticket price"
                value={formatLkr(computedFare.fareLkr)}
              />

              <InfoRow
                icon={<LayoutGrid className="h-4 w-4" />}
                label="Seat arrangement"
                value={seatLayoutType}
              />

              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Schedule stops"
                value={`${schedule?.stopTimes?.length || 0} stops`}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-sm text-white/60">
                {availabilityLoading ? "Checking seat availability..." : "Seat availability loaded"}
              </div>

              {availabilityError ? (
                <div className="mt-2 text-sm text-red-300">{availabilityError}</div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/65">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                    Booked seats: {bookedSeats.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                    Pending seats: {pendingSeats.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-sky-500/80" />
                    Your selected seats
                  </div>
                </div>
              )}
            </div>
          </section>

          <div>
            <BusSeatLayoutPreview
              busType={bus.busType}
              seatsTotal={bus.seatsTotal}
              selectedSeats={selectedSeats}
              reservedSeats={bookedSeats}
              pendingSeats={pendingSeats}
              onSeatToggle={handleSeatToggle}
            />
          </div>
        </div>

        <section className="mt-6 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,24,0.96)_0%,rgba(4,7,15,0.98)_100%)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-white/35">
                Selected Seats
              </div>

              <div className="mt-3 flex min-h-[44px] flex-wrap gap-2">
                {selectedSeats.length > 0 ? (
                  selectedSeats.map((seat) => (
                    <span
                      key={seat}
                      className="rounded-full border border-sky-400/30 bg-sky-500/20 px-3 py-1.5 text-sm font-medium text-sky-100"
                    >
                      {seat}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-white/50">No seats selected</span>
                )}
              </div>

              {errMsg ? (
                <div className="mt-4 text-[15px] leading-7 text-rose-300">
                  {errMsg}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-6 py-4">
              <div className="text-xs uppercase tracking-[0.28em] text-white/35">
                Total Amount
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {selectedSeats.length > 0 ? formatLkr(totalAmount) : "Select seats"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={!selectedSeats.length || proceeding || availabilityLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {proceeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {proceeding ? "Redirecting..." : "Proceed to Payment"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-white/60">
        {icon}
        <span>{label}</span>
      </div>
      <div className="max-w-[58%] text-right text-sm font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

function FeatureBlock({ features }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-white/60">
        <Sparkles className="h-4 w-4" />
        <span>Features</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {Array.isArray(features) && features.length > 0 ? (
          features.map((feature, index) => (
            <span
              key={`${feature}-${index}`}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/75"
            >
              {feature}
            </span>
          ))
        ) : (
          <span className="text-sm text-white/45">No features listed</span>
        )}
      </div>
    </div>
  );
}