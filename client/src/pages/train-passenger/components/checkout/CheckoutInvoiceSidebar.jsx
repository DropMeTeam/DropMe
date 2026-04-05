import { CreditCard, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

function formatTime12(time, fallback = "--") {
  if (!time || typeof time !== "string" || !time.includes(":")) return fallback;

  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return fallback;

  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export default function CheckoutInvoiceSidebar({
  trainName,
  trainNo,
  boardingName,
  destinationName,
  departureTime,
  arrivalTime,
  travelDate,
  seats,
  farePerSeat,
  totalFareLkr,
  canSubmit,
  submitting,
  cancelPath,
}) {
  const baseSubtotal = Number(farePerSeat || 0) * Number(seats || 0);
  const stripeSafeAdjustment = Math.max(0, Number(totalFareLkr || 0) - baseSubtotal);

  return (
    <aside className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,#1a1f2a_0%,#121620_58%,#0b0e14_100%)] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.34)] xl:sticky xl:top-5">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
        Fare Breakdown
      </div>

      <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-semibold text-white">{trainName}</div>
        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-cyan-300">{trainNo || "Train service"}</div>
        <div className="mt-3 text-sm text-zinc-300">
          {boardingName || "-"} → {destinationName || "-"}
        </div>
        <div className="mt-1 text-sm text-zinc-500">
          {formatTime12(departureTime)} - {formatTime12(arrivalTime)}
        </div>
        <div className="mt-1 text-sm text-zinc-500">{travelDate || "-"}</div>
      </div>

      <div className="mt-5 space-y-4 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,18,0.72),rgba(7,9,14,0.92))] p-4">
        <div className="flex items-start justify-between gap-3 text-sm">
          <div>
            <div className="font-medium text-zinc-200">Premium ticket x{seats}</div>
            <div className="mt-1 text-zinc-500">Base route fare</div>
          </div>
          <div className="font-semibold text-white">LKR {baseSubtotal.toFixed(2)}</div>
        </div>

        <div className="flex items-start justify-between gap-3 text-sm">
          <div>
            <div className="font-medium text-zinc-200">Fare per seat</div>
            <div className="mt-1 text-zinc-500">Calculated from selected route</div>
          </div>
          <div className="font-semibold text-white">LKR {Number(farePerSeat || 0).toFixed(2)}</div>
        </div>

        <div className="flex items-start justify-between gap-3 text-sm">
          <div>
            <div className="font-medium text-zinc-200">Stripe-safe adjustment</div>
            <div className="mt-1 text-zinc-500">Applied only when minimum payment is needed</div>
          </div>
          <div className="font-semibold text-cyan-300">LKR {stripeSafeAdjustment.toFixed(2)}</div>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,17,24,0.95),rgba(8,10,16,0.96))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Total Due
        </div>
        <div className="mt-2 text-4xl font-bold tracking-tight text-white">
          LKR {Number(totalFareLkr || 0).toFixed(2)}
        </div>
        <div className="mt-1 text-sm text-zinc-500">Secure checkout via Stripe</div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="mt-5 inline-flex w-full items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#22b3ff,#0f8ddb)] px-5 py-4 text-base font-semibold text-white shadow-[0_16px_32px_rgba(14,165,233,0.30)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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
        to={cancelPath}
        className="mt-3 block rounded-[16px] border border-white/8 bg-black/25 px-4 py-3 text-center text-sm font-medium text-zinc-300 transition hover:bg-white/[0.04] hover:text-white"
      >
        Cancel Booking
      </Link>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
        <span>Visa</span>
        <span>•</span>
        <span>Mastercard</span>
        <span>•</span>
        <span>Stripe</span>
      </div>
    </aside>
  );
}
