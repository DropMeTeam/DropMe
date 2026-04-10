import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BusFront,
  CalendarDays,
  MapPin,
  RefreshCw,
  Search,
  Ticket,
  CreditCard,
} from "lucide-react";
import { api } from "../../lib/api";

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatLkr(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "LKR 0";
  return `LKR ${n.toLocaleString()}`;
}

function pickFirst(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return "";
}

function normalizeSeatText(raw) {
  const seatList = pickFirst(
    raw?.seatNumbers,
    raw?.seats,
    raw?.seatNo,
    raw?.seatNumber
  );

  if (Array.isArray(seatList)) {
    const cleaned = seatList.map((seat) => String(seat).trim()).filter(Boolean);
    return cleaned.length ? cleaned.join(", ") : "—";
  }

  if (typeof seatList === "string") {
    return seatList.trim() || "—";
  }

  const seatCount = pickFirst(raw?.seatsBooked, raw?.seatCount, raw?.qty);
  if (seatCount) return String(seatCount);

  return "—";
}

function normalizeAmount(raw) {
  const direct = pickFirst(
    raw?.totalAmountLkr,
    raw?.totalAmount,
    raw?.amount,
    raw?.fare
  );

  if (direct !== "") return Number(direct || 0);

  const farePerSeat = Number(
    pickFirst(raw?.farePerSeatLkr, raw?.ticketPriceLkr, raw?.pricePerSeat, 0)
  );

  const seatCount = Array.isArray(raw?.seatNumbers)
    ? raw.seatNumbers.length
    : Number(pickFirst(raw?.seatsBooked, raw?.seatCount, 1));

  return farePerSeat * (seatCount || 1);
}

function normalizeBooking(raw, index) {
  const bus = raw?.busSnapshot || raw?.busId || raw?.bus || {};
  const pickupStop = raw?.pickupStop || {};
  const dropoffStop = raw?.dropoffStop || {};
  const journey = raw?.journeySnapshot || {};

  return {
    id: raw?._id || raw?.id || `booking-${index}`,
    busNo: pickFirst(
      journey?.busNumber,
      journey?.busNo,
      bus?.plateNumber,
      bus?.busNumber,
      bus?.number,
      raw?.busNumber,
      raw?.busNo
    ),
    pickup: pickFirst(
      pickupStop?.label,
      journey?.pickupLabel,
      raw?.pickupLabel,
      raw?.pickup,
      raw?.from
    ),
    dropoff: pickFirst(
      dropoffStop?.label,
      journey?.dropoffLabel,
      raw?.dropoffLabel,
      raw?.dropoff,
      raw?.to
    ),
    seatText: normalizeSeatText(raw),
    bookedDate: pickFirst(raw?.createdAt, raw?.bookedAt, raw?.updatedAt),
    amount: normalizeAmount(raw),
    bookingStatus: String(pickFirst(raw?.bookingStatus, raw?.status, "")).toLowerCase(),
    paymentStatus: String(pickFirst(raw?.paymentStatus, "")).toLowerCase(),
  };
}

function isVisibleTicket(booking) {
  const blockedBookingStatuses = [
    "pending",
    "failed",
    "cancelled",
    "canceled",
    "rejected",
    "expired",
  ];

  const blockedPaymentStatuses = [
    "pending",
    "failed",
    "unpaid",
    "cancelled",
    "canceled",
    "expired",
  ];

  if (blockedBookingStatuses.includes(booking.bookingStatus)) return false;
  if (blockedPaymentStatuses.includes(booking.paymentStatus)) return false;

  return true;
}

function shortLabel(label = "") {
  return String(label).split(",")[0].trim() || "—";
}

export default function MyBusTicketsPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadTickets(showRefresh = false) {
    setError("");

    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data } = await api.get("/api/bus/bookings/mine");

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.bookings)
        ? data.bookings
        : Array.isArray(data?.items)
        ? data.items
        : [];

      setItems(list);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to load bus tickets."
      );
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  const bookings = useMemo(() => {
    return items.map(normalizeBooking).filter(isVisibleTicket);
  }, [items]);

  return (
    <div className="min-h-screen bg-[#060812] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-2 text-xs font-medium text-fuchsia-200">
                <Ticket className="h-4 w-4" />
                Passenger Bus Tickets
              </div>

              <h1 className="mt-4 text-3xl font-bold md:text-4xl">My Bus Tickets</h1>
              <p className="mt-2 text-sm leading-7 text-white/60">
                Only your successful bus tickets are shown here.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => loadTickets(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>

              <Link
                to="/buses/search"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:opacity-90"
              >
                <Search className="h-4 w-4" />
                Search Buses
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-[28px] border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 rounded-[24px] border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-200">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <BusFront className="h-8 w-8 text-white/70" />
            </div>

            <h2 className="mt-4 text-xl font-semibold">No confirmed bus tickets</h2>
            <p className="mt-2 text-sm text-white/60">
              Pending and failed bookings are hidden. Your successful ticket cards will appear here.
            </p>

            <Link
              to="/buses/search"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:opacity-90"
            >
              <Search className="h-4 w-4" />
              Search Buses
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {bookings.map((booking) => (
              <article
                key={booking.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/buses/tickets/${booking.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/buses/tickets/${booking.id}`);
                  }
                }}
                className="cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-5 transition hover:border-cyan-300/20 hover:bg-white/[0.08]"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-200">
                    <BusFront className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                      Bus No
                    </div>
                    <h2 className="text-xl font-semibold text-white">
                      {booking.busNo || "—"}
                    </h2>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/45">
                      <MapPin className="h-4 w-4" />
                      Pickup
                    </div>
                    <div className="mt-2 text-sm font-medium text-white">
                      {shortLabel(booking.pickup)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/45">
                      <MapPin className="h-4 w-4" />
                      Dropoff
                    </div>
                    <div className="mt-2 text-sm font-medium text-white">
                      {shortLabel(booking.dropoff)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/45">
                      <Ticket className="h-4 w-4" />
                      Seat No
                    </div>
                    <div className="mt-2 text-sm font-medium text-white">
                      {booking.seatText}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/45">
                      <CreditCard className="h-4 w-4" />
                      Amount
                    </div>
                    <div className="mt-2 text-sm font-medium text-white">
                      {formatLkr(booking.amount)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/45">
                      <CalendarDays className="h-4 w-4" />
                      Booked Date
                    </div>
                    <div className="mt-2 text-sm font-medium text-white">
                      {formatDateTime(booking.bookedDate)}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}