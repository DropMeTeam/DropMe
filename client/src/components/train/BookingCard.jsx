import BookingStatusBadge from "./BookingStatusBadge";

export default function BookingCard({
  booking,
  onCancel,
  cancelling = false,
}) {
  const canCancel =
    booking?.paymentStatus !== "paid" &&
    booking?.bookingStatus !== "cancelled";

  return (
    <article className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            {booking?.journeySnapshot?.trainNo || "Train booking"}
          </div>

          <h3 className="mt-1 text-lg font-semibold">
            {booking?.journeySnapshot?.trainName || "Unnamed train service"}
          </h3>

          <div className="mt-2 text-sm text-zinc-400">
            {booking?.boardingStationName} → {booking?.destinationStationName}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <BookingStatusBadge
            label="Booking"
            status={booking?.bookingStatus}
          />
          <BookingStatusBadge
            label="Payment"
            status={booking?.paymentStatus}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-500">Travel date</div>
          <div className="mt-1 font-medium">{booking?.travelDate || "-"}</div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-500">Seats</div>
          <div className="mt-1 font-medium">{booking?.seats || 1}</div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-500">Fare</div>
          <div className="mt-1 font-medium">
            LKR {Number(booking?.totalFareLkr || 0).toFixed(2)}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-500">Payment ref</div>
          <div className="mt-1 break-all font-medium">
            {booking?.paymentReference || "-"}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-400">
        <div>
          Departure: {booking?.journeySnapshot?.departureTime || "-"} · Arrival:{" "}
          {booking?.journeySnapshot?.arrivalTime || "-"}
        </div>

        {canCancel ? (
          <button
            type="button"
            onClick={() => onCancel?.(booking)}
            disabled={cancelling}
            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-200 hover:bg-red-500/20 disabled:opacity-60"
          >
            {cancelling ? "Cancelling..." : "Cancel booking"}
          </button>
        ) : null}
      </div>
    </article>
  );
}