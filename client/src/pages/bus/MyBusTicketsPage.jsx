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
  Clock3,
} from "lucide-react";
import { api } from "../../lib/api";

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatTravelDate(value) {
  if (!value) return "—";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) {
    const raw = new Date(value);
    if (Number.isNaN(raw.getTime())) return "—";
    return raw.toLocaleDateString();
  }
  return d.toLocaleDateString();
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

function normalizeTime(value) {
  if (!value) return "—";

  const text = String(value).trim();
  if (!text) return "—";

  const directDate = new Date(text);
  if (!Number.isNaN(directDate.getTime())) {
    return directDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(text)) {
    const parts = text.split(":");
    const hour = Number(parts[0]);
    const minute = Number(parts[1]);

    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      const sample = new Date();
      sample.setHours(hour, minute, 0, 0);
      return sample.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
  }

  return text;
}

function toDayStart(dateValue) {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function getTravelDateObject(travelDate) {
  if (!travelDate) return null;

  const exact = new Date(`${travelDate}T00:00:00`);
  if (!Number.isNaN(exact.getTime())) return toDayStart(exact);

  const fallback = new Date(travelDate);
  if (!Number.isNaN(fallback.getTime())) return toDayStart(fallback);

  return null;
}

function normalizeBooking(raw, index) {
  const bus = raw?.busSnapshot || raw?.busId || raw?.bus || {};
  const pickupStop = raw?.pickupStop || {};
  const dropoffStop = raw?.dropoffStop || {};
  const journey = raw?.journeySnapshot || {};

  const travelDate = pickFirst(
    raw?.travelDate,
    journey?.travelDate,
    raw?.journeyDate
  );

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
    pickupTime: pickFirst(
      pickupStop?.time,
      journey?.pickupTime,
      raw?.pickupTime
    ),
    dropoffTime: pickFirst(
      dropoffStop?.time,
      journey?.dropoffTime,
      raw?.dropoffTime
    ),
    travelDate,
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

function compareUpcoming(a, b) {
  const ad = getTravelDateObject(a.travelDate);
  const bd = getTravelDateObject(b.travelDate);

  const at = ad ? ad.getTime() : Number.MAX_SAFE_INTEGER;
  const bt = bd ? bd.getTime() : Number.MAX_SAFE_INTEGER;

  if (at !== bt) return at - bt;
  return new Date(b.bookedDate || 0).getTime() - new Date(a.bookedDate || 0).getTime();
}

function comparePast(a, b) {
  const ad = getTravelDateObject(a.travelDate);
  const bd = getTravelDateObject(b.travelDate);

  const at = ad ? ad.getTime() : 0;
  const bt = bd ? bd.getTime() : 0;

  if (at !== bt) return bt - at;
  return new Date(b.bookedDate || 0).getTime() - new Date(a.bookedDate || 0).getTime();
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

  const { upcomingTickets, pastTickets } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const visible = items.map(normalizeBooking).filter(isVisibleTicket);

    const upcoming = [];
    const past = [];

    for (const booking of visible) {
      const travelDay = getTravelDateObject(booking.travelDate);

      if (!travelDay) {
        upcoming.push(booking);
        continue;
      }

      if (travelDay.getTime() >= today.getTime()) {
        upcoming.push(booking);
      } else {
        past.push(booking);
      }
    }

    upcoming.sort(compareUpcoming);
    past.sort(comparePast);

    return {
      upcomingTickets: upcoming,
      pastTickets: past,
    };
  }, [items]);

  const totalVisibleCount = upcomingTickets.length + pastTickets.length;

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
                Your successful tickets are separated into upcoming travel days and past travel days.
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
                className="h-80 animate-pulse rounded-[28px] border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 rounded-[24px] border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-200">
            {error}
          </div>
        ) : totalVisibleCount === 0 ? (
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
          <>
            <TicketSection
              title="Today & Upcoming Tickets"
              subtitle="Tickets for today and future travel dates."
              items={upcomingTickets}
              emptyText="No today or upcoming tickets."
              onOpenTicket={(bookingId) => navigate(`/buses/tickets/${bookingId}`)}
            />

            <TicketSection
              title="Past Tickets"
              subtitle="Tickets from completed past travel dates."
              items={pastTickets}
              emptyText="No past tickets."
              onOpenTicket={(bookingId) => navigate(`/buses/tickets/${bookingId}`)}
              className="mt-10"
            />
          </>
        )}
      </div>
    </div>
  );
}

function JourneyRow({ icon, label, place, time }) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/45">
          {icon}
          {label}
        </div>
  
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="min-w-0 text-sm font-medium text-white">
            {place || "—"}
          </div>
  
          <div className="shrink-0 text-sm font-medium text-cyan-200">
            {time || "—"}
          </div>
        </div>
      </div>
    );
  }

function TicketSection({
  title,
  subtitle,
  items,
  emptyText,
  onOpenTicket,
  className = "",
}) {
  return (
    <section className={className ? className : "mt-10"}>
      <div className="mb-5 flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/55">{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-white/55">
          {emptyText}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((booking) => (
            <article
              key={booking.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenTicket(booking.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenTicket(booking.id);
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
                <CardRow
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Travel Date"
                  value={formatTravelDate(booking.travelDate)}
                />

                <JourneyRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Pickup"
                  place={shortLabel(booking.pickup)}
                  time={normalizeTime(booking.pickupTime)}
                />

                <JourneyRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Dropoff"
                  place={shortLabel(booking.dropoff)}
                  time={normalizeTime(booking.dropoffTime)}
                />

                <CardRow
                  icon={<Ticket className="h-4 w-4" />}
                  label="Seat No"
                  value={booking.seatText}
                />

                <CardRow
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Amount"
                  value={formatLkr(booking.amount)}
                />

                <CardRow
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Booked Date"
                  value={formatDateTime(booking.bookedDate)}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CardRow({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/45">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-white">{value || "—"}</div>
    </div>
  );
}