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
  return (
    <aside className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,#171c27_0%,#0e1117_60%,#090b10_100%)] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] xl:sticky xl:top-6 xl:h-fit">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-white">Invoice</h2>
        <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-400">
          Pending
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div className="border-b border-white/10 pb-5">
          <div className="text-lg font-medium text-white">{trainName}</div>
          <div className="mt-1 text-sm text-cyan-300">{trainNo || "-"}</div>
          <div className="mt-2 text-sm text-zinc-400">
            {boardingName || "-"} → {destinationName || "-"}
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            {formatTime12(departureTime)} - {formatTime12(arrivalTime)}
          </div>
          <div className="mt-1 text-sm text-zinc-500">{travelDate || "-"}</div>
        </div>

        <div className="space-y-4 border-b border-white/10 pb-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-medium text-white">Fare per seat</div>
              <div className="text-sm text-zinc-500">Calculated from selected route</div>
            </div>
            <div className="text-lg font-semibold text-white">
              LKR {Number(farePerSeat || 0).toFixed(2)}
            </div>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-medium text-white">Passengers</div>
              <div className="text-sm text-zinc-500">
                {seats} {seats === 1 ? "seat" : "seats"}
              </div>
            </div>
            <div className="text-lg font-semibold text-white">{seats}</div>
          </div>
        </div>

        <div className="rounded-[24px] bg-black/40 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Total Due
          </div>
          <div className="mt-2 text-4xl font-bold text-white">
            LKR {Number(totalFareLkr || 0).toFixed(2)}
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="inline-flex w-full items-center justify-center rounded-[22px] bg-cyan-400 px-5 py-4 text-base font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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
          className="block text-center text-sm text-zinc-400 transition hover:text-white"
        >
          Cancel booking
        </Link>
      </div>
    </aside>
  );
}
