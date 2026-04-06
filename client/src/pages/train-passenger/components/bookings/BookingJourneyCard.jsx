import { Loader2 } from "lucide-react";
import {
  formatBookingDate,
  formatTime12,
  getBookingStatusMeta,
  getJourneySnapshot,
  getSeatLabel,
  isBookingCancellable,
} from "./bookings.utils";

export default function BookingJourneyCard({ booking, onCancel, cancelling = false }) {
  const snapshot = getJourneySnapshot(booking);
  const status = getBookingStatusMeta(booking);

  const fromName =
    booking?.boardingStationName ||
    booking?.boardingStation?.name ||
    booking?.fromStationName ||
    "Boarding station";

  const toName =
    booking?.destinationStationName ||
    booking?.destinationStation?.name ||
    booking?.toStationName ||
    "Destination station";

  const departureTime = snapshot?.departureTime || booking?.departureTime || "";
  const arrivalTime = snapshot?.arrivalTime || booking?.arrivalTime || "";
  const durationLabel = snapshot?.durationLabel || booking?.durationLabel || "Direct";
  const bookingRef =
    booking?.referenceNo ||
    booking?.bookingRef ||
    booking?._id?.slice(-8)?.toUpperCase() ||
    "BOOKING";

  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(22,24,30,0.97),rgba(12,14,20,0.98))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition hover:border-white/15 md:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.07),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.05),transparent_25%)] opacity-80" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${status.chipClass}`}
          >
            {status.label}
          </span>

          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            #{bookingRef}
          </span>
        </div>

        <div className="mt-5 grid items-start gap-5 md:grid-cols-[1fr_auto_1fr]">
          <div>
            <div className="text-2xl font-bold leading-tight text-white md:text-3xl">
              {fromName}
            </div>
          </div>

          <div className="min-w-[120px] pt-2 text-center">
            <div className="text-xs font-medium text-zinc-500">{durationLabel}</div>
            <div className="mt-2 h-px w-full bg-white/10" />
            <div className="mt-2 text-xs text-zinc-500">
              {snapshot?.segmentCount ? `${snapshot.segmentCount} segments` : "Journey"}
            </div>
          </div>

          <div className="md:text-right">
            <div className="text-2xl font-bold leading-tight text-white md:text-3xl">
              {toName}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-white/8 pt-5 md:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Departure
              </div>
              <div className="mt-2 text-lg font-bold text-white">
                {formatTime12(departureTime)}
              </div>
            </div>

            <div className="md:text-right">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Arrival
              </div>
              <div className="mt-2 text-lg font-bold text-white">
                {formatTime12(arrivalTime)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 md:text-right">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Date
              </div>
              <div className="mt-2 text-sm font-semibold text-white">
                {formatBookingDate(booking?.travelDate)}
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Seat
              </div>
              <div className="mt-2 text-sm font-semibold text-white">
                {getSeatLabel(booking)}
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Fare
              </div>
              <div className="mt-2 text-sm font-semibold text-white">
                LKR {booking?.totalFareLkr || "--"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}