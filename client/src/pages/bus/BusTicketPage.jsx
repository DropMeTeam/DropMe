import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle2,
  BusFront,
  CalendarDays,
  MapPin,
  Route as RouteIcon,
  CreditCard,
  Ticket,
  Download,
  ArrowLeft,
  Loader2,
  QrCode,
  Flag,
  CircleDot,
  ShieldCheck,
  UserRound,
  Mail,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../../lib/api";

function shortLabel(label = "") {
  return String(label).split(",")[0].trim();
}

function formatLkr(value) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function getApiOrigin() {
  const base = api?.defaults?.baseURL || "";
  if (typeof base === "string" && base.startsWith("http")) {
    return base.replace(/\/$/, "");
  }
  return "http://localhost:5000";
}

function getTravelDayText(dateString) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

export default function BusTicketPage() {
  const { bookingId } = useParams();

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("Loading ticket...");
  const [booking, setBooking] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const { data } = await api.get("/api/bus/bookings/mine");

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.bookings)
          ? data.bookings
          : Array.isArray(data?.items)
          ? data.items
          : [];

        const found = list.find((item) => String(item?._id) === String(bookingId));

        if (ignore) return;

        if (!found) {
          setMsg("Ticket not found.");
          setBooking(null);
          return;
        }

        setBooking(found);
        setMsg("Confirmed bus ticket.");
      } catch (e) {
        if (ignore) return;
        setMsg(e?.response?.data?.message || "Failed to load ticket");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [bookingId]);

  const apiOrigin = useMemo(() => getApiOrigin(), []);
  const logoUrl = `${apiOrigin}/uploads/dropme-logo.jpeg`;

  const seatText =
    Array.isArray(booking?.seatNumbers) && booking.seatNumbers.length > 0
      ? booking.seatNumbers.join(" , ")
      : "—";

  const seatCount = Array.isArray(booking?.seatNumbers)
    ? booking.seatNumbers.length
    : 0;

  const pickupName = shortLabel(booking?.pickupStop?.label);
  const dropoffName = shortLabel(booking?.dropoffStop?.label);
  const pickupTime = booking?.pickupStop?.time || "Time not available";
  const dropoffTime = booking?.dropoffStop?.time || "Time not available";

  const busRouteText = useMemo(() => {
    const rawRoute = booking?.journeySnapshot?.routeLabel || "";

    if (!rawRoute) return "-";

    const parts = String(rawRoute).split("→").map((part) => shortLabel(part));

    if (parts.length >= 2) {
      return `${parts[0]} → ${parts[1]}`;
    }

    return shortLabel(rawRoute);
  }, [booking?.journeySnapshot?.routeLabel]);

  const passengerName =
    booking?.passengerSnapshot?.name ||
    booking?.passengerSnapshot?.fullName ||
    "-";

  const passengerEmail = booking?.passengerSnapshot?.email || "-";

  const travelDay = getTravelDayText(booking?.travelDate);
  const totalAmount = formatLkr(
    booking?.totalAmountLkr || booking?.totalAmount || booking?.amount || 0
  );
  const farePerSeat = formatLkr(
    booking?.farePerSeatLkr || booking?.ticketPriceLkr || booking?.pricePerSeat || 0
  );
  const distanceText = `${Number(
    booking?.journeySnapshot?.passengerDistanceKm || 0
  ).toFixed(1)} km`;

  const busNo =
    booking?.journeySnapshot?.busNumber ||
    booking?.busSnapshot?.plateNumber ||
    booking?.busId?.plateNumber ||
    "-";

  const qrPayload = useMemo(() => {
    if (!booking) return "DropMe Bus Ticket";

    return [
      "DropMe Bus Ticket",
      `Booking ID: ${booking?._id || "-"}`,
      `Passenger: ${passengerName}`,
      `Passenger Email: ${passengerEmail}`,
      `Travel Date: ${booking?.travelDate || "-"}`,
      `Bus No: ${busNo}`,
      `Route No: ${booking?.journeySnapshot?.routeNumber || "-"}`,
      `Bus Route: ${busRouteText}`,
      `Pickup: ${pickupName} ${pickupTime}`,
      `Dropoff: ${dropoffName} ${dropoffTime}`,
      `Seats: ${seatText}`,
      `Total: ${totalAmount}`,
      `Booking Status: ${booking?.bookingStatus || "-"}`,
      `Payment Status: ${booking?.paymentStatus || "-"}`,
    ].join("\n");
  }, [
    booking,
    passengerName,
    passengerEmail,
    busNo,
    busRouteText,
    pickupName,
    pickupTime,
    dropoffName,
    dropoffTime,
    seatText,
    totalAmount,
  ]);

  async function handleDownloadPdf() {
    if (!booking?._id) return;

    try {
      setDownloadingPdf(true);

      const response = await api.get(`/api/bus/bookings/${booking._id}/ticket-pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `DropMe-Bus-Ticket-${booking._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to download ticket PDF"
      );
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060812] bg-[radial-gradient(circle_at_10%_20%,rgba(10,15,26,1)_0%,rgba(6,8,18,1)_70%)] px-4 py-5 text-white sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">
        {!loading && booking ? (
          <ActionButtons
            topAlign="right"
            onDownload={handleDownloadPdf}
            downloadingPdf={downloadingPdf}
          />
        ) : null}

        <div className={!loading && booking ? "mt-4" : ""}>
          {loading ? (
            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,#0e121c_0%,#080b12_100%)] p-6 shadow-[0_30px_50px_rgba(0,0,0,0.55)]">
              <div className="flex items-center gap-3 text-white/70">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading ticket...</span>
              </div>

              <div className="mt-6 grid gap-4">
                <LoadingBlock className="h-20" />
                <LoadingBlock className="h-24" />
                <LoadingBlock className="h-48" />
                <LoadingBlock className="h-28" />
              </div>
            </div>
          ) : booking ? (
            <div className="overflow-hidden rounded-[30px] border border-[#ffd77826] bg-[linear-gradient(145deg,#0e121c_0%,#080b12_100%)] shadow-[0_30px_50px_rgba(0,0,0,0.6)]">
              <div className="border-b border-[#ffc8504d] bg-[#05080f] px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1 shadow-[0_4px_12px_rgba(0,0,0,0.2)] sm:h-[52px] sm:w-[52px]">
                      <img
                        src={logoUrl}
                        alt="DropMe logo"
                        className="h-full w-full rounded-xl object-cover"
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="bg-[linear-gradient(135deg,#FFF5E0,#FFE5B4)] bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
                          DropMe
                        </h1>
                        <span className="rounded-full bg-[#ffd77822] px-3 py-1 text-[11px] font-medium text-[#ffd966]">
                          e-ticket
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-white/55">
                        Premium bus ticket
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd7004d] bg-[#ffc8641f] px-4 py-2 text-xs font-semibold text-[#ffde9c]">
                    <ShieldCheck className="h-4 w-4" />
                    QR secure
                  </div>
                </div>
              </div>

              <div className="px-4 py-4 sm:px-6">
                <div className="rounded-2xl border border-[#2e7d5e] bg-[rgba(0,30,20,0.7)] px-4 py-3 text-[#b9f6ca]">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#4cd964]" />
                    <div>
                      <div className="font-semibold">Ticket confirmed</div>
                      <div className="mt-1 text-sm text-[#d7ffe4cc]">
                        {msg} ({totalAmount})
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <InfoItem
                    icon={<Ticket className="h-4 w-4" />}
                    label="Booking ID"
                    value={booking?._id}
                    mono
                  />
                  <InfoItem
                    icon={<CalendarDays className="h-4 w-4" />}
                    label="Travel Date"
                    value={`${booking?.travelDate || "-"}${travelDay ? ` (${travelDay})` : ""}`}
                  />
                  <InfoItem
                    icon={<BusFront className="h-4 w-4" />}
                    label="Bus No"
                    value={busNo}
                  />
                  <InfoItem
                    icon={<RouteIcon className="h-4 w-4" />}
                    label="Route No"
                    value={booking?.journeySnapshot?.routeNumber || "-"}
                  />
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" />}
                    label="Bus Route"
                    value={busRouteText}
                  />
                  <InfoItem
                    icon={<RouteIcon className="h-4 w-4" />}
                    label="Distance"
                    value={distanceText}
                  />
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[24px] border border-[#ffd26e33] bg-[rgba(10,15,26,0.7)] p-4 sm:p-5">
                    <div className="flex flex-col gap-4">
                      <StopCard
                        icon={<CircleDot className="h-4 w-4" />}
                        title={`${pickupName} · Pickup point`}
                        time={pickupTime}
                      />

                      <div className="ml-4 flex items-center gap-2 text-xs text-[#ffcd7e99]">
                        <RouteIcon className="h-4 w-4" />
                        <span>
                          Journey via route {booking?.journeySnapshot?.routeNumber || "-"}
                        </span>
                      </div>

                      <StopCard
                        icon={<Flag className="h-4 w-4" />}
                        title={`${dropoffName} · Dropoff`}
                        time={dropoffTime}
                      />
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 sm:p-5">
                    <div className="text-xs uppercase tracking-[0.28em] text-white/35">
                      Passenger Details
                    </div>

                    <div className="mt-4 space-y-3">
                      <MiniRow
                        icon={<UserRound className="h-4 w-4" />}
                        label="Passenger Name"
                        value={passengerName}
                      />
                      <MiniRow
                        icon={<Mail className="h-4 w-4" />}
                        label="Passenger Email"
                        value={passengerEmail}
                      />
                      <MiniRow
                        icon={<Ticket className="h-4 w-4" />}
                        label="Seats"
                        value={seatText}
                      />
                      <MiniRow
                        icon={<CreditCard className="h-4 w-4" />}
                        label="Fare / seat"
                        value={farePerSeat}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl border border-[#2a2f3f] bg-[#0a0e16] p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="rounded-full border-l-[3px] border-[#ffb347] bg-[#1e2a3a] px-4 py-2 text-base font-bold text-[#ffdd99]">
                        Seats {seatText}
                      </div>

                      <div className="grid grid-cols-2 gap-4 sm:w-auto">
                        <MetricCard label="Journey" value={distanceText} />
                        <MetricCard label="Fare / Seat" value={farePerSeat} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#ffd7784d] bg-[#00000066] px-4 py-4">
                    <div className="text-sm font-bold text-[#ffdeae]">
                      Total ({seatCount || 0} seat{seatCount === 1 ? "" : "s"})
                    </div>
                    <div className="mt-2 bg-[linear-gradient(135deg,#FFE5B4,#ffc857)] bg-clip-text text-3xl font-extrabold text-transparent sm:text-[2rem]">
                      {totalAmount}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <StatusBadge
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    label={`Booking Status : ${booking?.bookingStatus || "-"}`}
                    variant="booked"
                  />
                  <StatusBadge
                    icon={<CreditCard className="h-4 w-4" />}
                    label={`Payment Status : ${booking?.paymentStatus || "-"}`}
                    variant="paid"
                  />
                </div>

                <div className="mt-6 border-t border-dashed border-[#ffd7964d] pt-6">
                  <div className="text-center">
                    <div className="inline-block rounded-[24px] bg-white p-3 shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
                      <QRCodeSVG
                        value={qrPayload}
                        size={140}
                        bgColor="#FFFFFF"
                        fgColor="#003B6F"
                        level="M"
                        includeMargin
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-[#ffdeae]">
                      <QrCode className="h-4 w-4" />
                      Scan QR with DropMe app to verify ticket
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-[#ffc86433] bg-[#03060c] px-4 py-4 text-xs text-[#b2c3df] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
                <span>e-ticket • valid with ID proof</span>
                <span>DropMe support 24/7</span>
                <span>digital copy accepted</span>
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border border-red-400/20 bg-red-500/10 p-6 text-red-100 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
              <h1 className="text-2xl font-semibold">Ticket not available</h1>
              <p className="mt-2 text-sm leading-6 text-red-100/80">{msg}</p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/buses/tickets"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black"
                >
                  Back to My Bus Tickets
                </Link>

                <Link
                  to="/buses/search"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white"
                >
                  Search Buses
                </Link>
              </div>
            </div>
          )}
        </div>

        {!loading && booking ? (
          <ActionButtons
            topAlign="center"
            onDownload={handleDownloadPdf}
            downloadingPdf={downloadingPdf}
          />
        ) : null}
      </div>
    </div>
  );
}

function ActionButtons({ topAlign = "right", onDownload, downloadingPdf = false }) {
  const wrapperClass =
    topAlign === "center"
      ? "mt-6 flex flex-wrap items-center justify-center gap-4"
      : "mb-4 flex flex-wrap items-center justify-end gap-4";

  return (
    <div className={wrapperClass}>
      <button
        type="button"
        onClick={onDownload}
        disabled={downloadingPdf}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-[#ffcd7e] bg-[#1e293b] px-5 py-3 text-sm font-semibold text-[#ffdeae] transition hover:bg-[#ffcd7e22] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Download className="h-4 w-4" />
        {downloadingPdf ? "Downloading..." : "Download Ticket PDF"}
      </button>

      <Link
        to="/buses/tickets"
        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Bus Tickets
      </Link>

      <Link
        to="/buses/search"
        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
      >
        Search Buses
      </Link>
    </div>
  );
}

function InfoItem({ icon, label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#bcbcde]">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={`text-sm font-bold text-[#f0f3fa] sm:text-base ${
          mono ? "break-all rounded-full bg-[#1a1f2c] px-3 py-1 font-mono text-[#ffdfaa]" : ""
        }`}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function StopCard({ icon, title, time }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#ffcd7e40] bg-[#0f1420] text-[#ffcd7e]">
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-base font-bold text-white">{title}</div>
        <div className="mt-1 text-sm text-[#b9c7e0]">{time}</div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-[#9aaec9]">
        {label}
      </div>
      <div className="mt-1 text-lg font-extrabold text-[#f5e7c8]">{value}</div>
    </div>
  );
}

function StatusBadge({ icon, label, variant = "default" }) {
  const classes =
    variant === "paid"
      ? "border border-[#2e7d5e] bg-[#1c3b2a] text-[#b2f0c4]"
      : variant === "booked"
      ? "border border-[#ffcd7e] bg-[#20273d] text-[#ffd966]"
      : "bg-[rgba(30,35,50,0.8)] text-[#ccddf8]";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${classes}`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

function MiniRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-white/60">
        {icon}
        <span>{label}</span>
      </div>
      <div className="max-w-[55%] break-all text-right text-sm font-semibold text-white">
        {value || "-"}
      </div>
    </div>
  );
}

function LoadingBlock({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-3xl border border-white/10 bg-white/[0.04] ${className}`}
    />
  );
}