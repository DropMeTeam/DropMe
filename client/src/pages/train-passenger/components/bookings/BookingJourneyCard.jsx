import { Download, Loader2 } from "lucide-react";
import { api } from "../../../../lib/api";
import {
  formatBookingDate,
  formatTime12,
  getBookingStatusMeta,
  getJourneySnapshot,
  getSeatLabel,
} from "./bookings.utils";
import { useState } from "react";

function formatFare(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "--";
  return amount.toFixed(2);
}

function getFilenameFromDisposition(disposition, fallback = "train-ticket.pdf") {
  if (!disposition) return fallback;

  const match =
    disposition.match(/filename\*=UTF-8''([^;]+)/i) ||
    disposition.match(/filename="?([^"]+)"?/i);

  if (!match?.[1]) return fallback;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export default function BookingJourneyCard({
  booking,
  onCancel,
  cancelling = false,
}) {
  const snapshot = getJourneySnapshot(booking);
  const status = getBookingStatusMeta(booking);
  const [downloading, setDownloading] = useState(false);

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
  const durationLabel =
    snapshot?.durationLabel || booking?.durationLabel || "Direct";

  const bookingRef =
    booking?.ticketNumber ||
    booking?.referenceNo ||
    booking?.bookingRef ||
    booking?._id?.slice(-8)?.toUpperCase() ||
    "BOOKING";

  const isPaidTicket =
    booking?.paymentStatus === "paid" && booking?.bookingStatus === "booked";

  async function handleDownloadTicket() {
    if (!booking?._id || downloading) return;

    try {
      setDownloading(true);

      const response = await api.get(`/api/train/bookings/${booking._id}/ticket`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const disposition = response.headers["content-disposition"];
      const filename = getFilenameFromDisposition(
        disposition,
        `train-ticket-${booking._id}.pdf`
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      const message =
        e?.response?.data?.message ||
        "Failed to download ticket. Check train route and authentication.";
      alert(message);
    } finally {
      setDownloading(false);
    }
  }

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
                LKR {formatFare(booking?.totalFareLkr)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-white/8 pt-4">
          {isPaidTicket ? (
            <button
              type="button"
              onClick={handleDownloadTicket}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15 disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {downloading ? "Downloading..." : "Download Ticket"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}