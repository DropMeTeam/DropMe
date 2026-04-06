import { CalendarDays, ShieldCheck } from "lucide-react";
import CheckoutSeatCounter from "./CheckoutSeatCounter";

export default function CheckoutPreferencesSection({
  travelDate,
  onTravelDateChange,
  seats,
  onSeatsChange,
  minDate,
  minPaymentLkr,
  submitting,
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,#171b26_0%,#11151f_58%,#0b0e14_100%)] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.32)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-cyan-300">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Travel Details</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Confirm the editable checkout fields before payment.
              </p>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Route locked
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,17,24,0.94),rgba(8,10,16,0.94))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Date
              </div>
              <div className="mt-1 text-sm text-zinc-400">Choose your travel date</div>
            </div>

            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-200">
              <CalendarDays className="h-4.5 w-4.5" />
            </div>
          </div>

          <input
            type="date"
            value={travelDate}
            min={minDate}
            onChange={(e) => onTravelDateChange(e.target.value)}
            disabled={submitting}
            className="w-full rounded-[18px] border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-400/40"
          />
        </div>

        <CheckoutSeatCounter
          value={seats}
          onChange={onSeatsChange}
          min={1}
          max={6}
          disabled={submitting}
        />
      </div>

      <div className="mt-5 rounded-[22px] border border-amber-500/25 bg-[linear-gradient(90deg,rgba(120,53,15,0.18),rgba(234,179,8,0.10))] px-4 py-3 text-sm text-amber-100">
        Stripe-safe minimum total:
        <span className="ml-1 font-semibold">LKR {minPaymentLkr}</span>
      </div>
    </section>
  );
}
