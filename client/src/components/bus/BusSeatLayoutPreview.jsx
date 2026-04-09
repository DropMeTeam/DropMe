import { BusFront } from "lucide-react";
import {
  buildSeatLayout,
  isValidSeatCount,
  getRearRowSeatCount,
  getNormalEntranceSeatCount,
} from "../../lib/busSeatLayout";

export default function BusSeatLayoutPreview({
  busType,
  seatsTotal,
  selectedSeats = [],
  reservedSeats = [],
  pendingSeats = [],
  onSeatToggle,
}) {
  const layout = buildSeatLayout(busType, seatsTotal);
  const rearRowSeats = getRearRowSeatCount(busType, seatsTotal);
  const entranceRowSeats = getNormalEntranceSeatCount(busType, seatsTotal);

  if (!isValidSeatCount(busType, seatsTotal)) {
    return (
      <section className="rounded-3xl border border-red-400/20 bg-red-500/10 p-5 text-red-100">
        <h3 className="text-lg font-semibold">Invalid seat layout</h3>
        <p className="mt-2 text-sm text-red-100/80">
          {busType} does not support {seatsTotal} seats.
        </p>
        <p className="mt-1 text-xs text-red-100/70">
          Allowed values: {layout.allowedOptions.join(", ")}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,24,0.96)_0%,rgba(4,7,15,0.98)_100%)] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Seat Arrangement</h3>
          <p className="mt-1 text-sm text-white/60">
            {busType} · {layout.layoutType} layout · {layout.totalSeats} seats
          </p>
          <p className="mt-1 text-xs text-white/45">
            Entrance row: {entranceRowSeats} seats · Rear row: {rearRowSeats} seats
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <LegendBadge
            label="Available"
            className="border-white/10 bg-white/5 text-white/70"
          />
          <LegendBadge
            label="Selected"
            className="border-sky-400/30 bg-sky-500/20 text-sky-200"
          />
          <LegendBadge
            label="Pending"
            className="border-amber-400/30 bg-amber-500/20 text-amber-200"
          />
          <LegendBadge
            label="Booked"
            className="border-red-400/30 bg-red-500/20 text-red-200"
          />
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-4">
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/75">
            Entrance
          </div>

          <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white">
            <BusFront className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.2em]">
              Driver
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {layout.rows.map((row, rowIndex) => {
            if (row.kind === "rear") {
              return (
                <RearSeatRow
                  key={`rear-${rowIndex}-${row.rowLabel}`}
                  seats={row.seats}
                  selectedSeats={selectedSeats}
                  reservedSeats={reservedSeats}
                  pendingSeats={pendingSeats}
                  onSeatToggle={onSeatToggle}
                />
              );
            }

            if (row.kind === "entrance") {
              return (
                <EntranceSeatRow
                  key={`entrance-${rowIndex}-${row.rowLabel}`}
                  seats={row.seats}
                  selectedSeats={selectedSeats}
                  reservedSeats={reservedSeats}
                  pendingSeats={pendingSeats}
                  onSeatToggle={onSeatToggle}
                />
              );
            }

            return (
              <div
                key={`row-${rowIndex}-${row.rowLabel}`}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"
              >
                <SeatGroup
                  seats={row.left}
                  selectedSeats={selectedSeats}
                  reservedSeats={reservedSeats}
                  pendingSeats={pendingSeats}
                  onSeatToggle={onSeatToggle}
                />

                <div className="flex h-full min-h-[48px] items-center justify-center px-2">
                  <div className="h-full w-7 rounded-full border border-dashed border-white/10 bg-white/[0.02]" />
                </div>

                <SeatGroup
                  seats={row.right}
                  selectedSeats={selectedSeats}
                  reservedSeats={reservedSeats}
                  pendingSeats={pendingSeats}
                  onSeatToggle={onSeatToggle}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function getSeatStateClass(seatNo, selectedSeats, reservedSeats, pendingSeats) {
  const isSelected = selectedSeats.includes(seatNo);
  const isReserved = reservedSeats.includes(seatNo);
  const isPending = pendingSeats.includes(seatNo);

  if (isSelected) {
    return "border-sky-400/30 bg-sky-500/20 text-sky-100";
  }

  if (isPending) {
    return "cursor-not-allowed border-amber-400/30 bg-amber-500/20 text-amber-100";
  }

  if (isReserved) {
    return "cursor-not-allowed border-red-400/30 bg-red-500/20 text-red-200";
  }

  return "border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08]";
}

function isSeatBlocked(seatNo, reservedSeats, pendingSeats) {
  return reservedSeats.includes(seatNo) || pendingSeats.includes(seatNo);
}

function SeatButton({
  seatNo,
  selectedSeats,
  reservedSeats,
  pendingSeats,
  onSeatToggle,
}) {
  const blocked = isSeatBlocked(seatNo, reservedSeats, pendingSeats);
  const className = getSeatStateClass(
    seatNo,
    selectedSeats,
    reservedSeats,
    pendingSeats
  );

  return (
    <button
      type="button"
      disabled={blocked || !onSeatToggle}
      onClick={() => onSeatToggle?.(seatNo)}
      className={`h-12 rounded-xl border text-sm font-semibold transition ${className}`}
    >
      {seatNo}
    </button>
  );
}

function SeatGroup({
  seats,
  selectedSeats,
  reservedSeats,
  pendingSeats,
  onSeatToggle,
}) {
  const columnCount = Math.max(seats.length, 1);

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
    >
      {seats.map((seatNo) => (
        <SeatButton
          key={seatNo}
          seatNo={seatNo}
          selectedSeats={selectedSeats}
          reservedSeats={reservedSeats}
          pendingSeats={pendingSeats}
          onSeatToggle={onSeatToggle}
        />
      ))}
    </div>
  );
}

function EntranceSeatRow({
  seats,
  selectedSeats,
  reservedSeats,
  pendingSeats,
  onSeatToggle,
}) {
  const seatColumns = Math.max(seats.length, 1);

  return (
    <div className="grid grid-cols-[1fr_auto_1.5fr] items-center gap-3">
      <div className="flex h-12 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-xs font-medium uppercase tracking-[0.2em] text-white/45">
        Entrance
      </div>

      <div className="flex h-full min-h-[48px] items-center justify-center px-2">
        <div className="h-full w-7 rounded-full border border-dashed border-white/10 bg-white/[0.02]" />
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${seatColumns}, minmax(0, 1fr))` }}
      >
        {seats.map((seatNo) => (
          <SeatButton
            key={seatNo}
            seatNo={seatNo}
            selectedSeats={selectedSeats}
            reservedSeats={reservedSeats}
            pendingSeats={pendingSeats}
            onSeatToggle={onSeatToggle}
          />
        ))}
      </div>
    </div>
  );
}

function RearSeatRow({
  seats,
  selectedSeats,
  reservedSeats,
  pendingSeats,
  onSeatToggle,
}) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${seats.length}, minmax(0, 1fr))` }}
    >
      {seats.map((seatNo) => (
        <SeatButton
          key={seatNo}
          seatNo={seatNo}
          selectedSeats={selectedSeats}
          reservedSeats={reservedSeats}
          pendingSeats={pendingSeats}
          onSeatToggle={onSeatToggle}
        />
      ))}
    </div>
  );
}

function LegendBadge({ label, className }) {
  return <div className={`rounded-full border px-3 py-1 ${className}`}>{label}</div>;
}