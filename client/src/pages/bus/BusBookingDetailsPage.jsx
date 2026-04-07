import { useState } from "react";
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
} from "lucide-react";
import { api } from "../../lib/api";
import { calculateBusFare, formatLkr } from "../../lib/busFare";
import { getBusLayoutType } from "../../lib/busSeatLayout";
import BusSeatLayoutPreview from "../../components/bus/BusSeatLayoutPreview";

function shortLabel(label = "") {
  return String(label).split(",")[0].trim();
}

export default function BusBookingDetailsPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const bus = state?.bus || null;
  const route = state?.route || null;
  const schedule = state?.schedule || null;
  const searchData = state?.searchData || null;

  const [selectedSeats, setSelectedSeats] = useState([]);
  const reservedSeats = [];

  if (!bus || !route || !searchData) {
    return (
      <div className="min-h-screen bg-[#060812] px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <h1 className="text-2xl font-semibold">Booking details unavailable</h1>
          <p className="mt-2 text-white/60">
            Open this page by selecting a bus from the bus booking flow.
          </p>

          <button
            onClick={() => navigate("/bus-booking")}
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

  function handleSeatToggle(seatNo) {
    setSelectedSeats((prev) =>
      prev.includes(seatNo)
        ? prev.filter((item) => item !== seatNo)
        : [...prev, seatNo]
    );
  }

  function handleProceedToPayment() {
    if (!selectedSeats.length) {
      alert("Please select at least one seat.");
      return;
    }

    // Next step:
    // navigate("/bus-booking/payment", { state: { ... } });
    alert("Proceed to payment flow will be connected next.");
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
          {/* LEFT: Booking Details */}
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
                value={`${shortLabel(searchData?.from?.label)} -> ${shortLabel(searchData?.to?.label)}`}
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
          </section>

          {/* RIGHT: Seat Arrangement */}
          <div>
            <BusSeatLayoutPreview
              busType={bus.busType}
              seatsTotal={bus.seatsTotal}
              selectedSeats={selectedSeats}
              reservedSeats={reservedSeats}
              onSeatToggle={handleSeatToggle}
            />
          </div>
        </div>

        {/* BOTTOM SUMMARY */}
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
                  <span className="text-sm text-white/50">
                    No seats selected
                  </span>
                )}
              </div>
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
              disabled={!selectedSeats.length}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CreditCard className="h-4 w-4" />
              Proceed to Payment
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