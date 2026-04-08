import { Minus, Plus, Users } from "lucide-react";

export default function CheckoutSeatCounter({
  value,
  onChange,
  min = 1,
  max = 6,
  disabled = false,
}) {
  function decrease() {
    if (disabled) return;
    onChange(Math.max(min, Number(value || min) - 1));
  }

  function increase() {
    if (disabled) return;
    onChange(Math.min(max, Number(value || min) + 1));
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,17,24,0.94),rgba(8,10,16,0.94))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Passengers
          </div>
          <div className="mt-1 text-sm text-zinc-400">Adjust seat count for this booking</div>
        </div>

        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-200">
          <Users className="h-4.5 w-4.5" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-black/25 px-3 py-3">
        <button
          type="button"
          onClick={decrease}
          disabled={disabled || value <= min}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="min-w-[100px] text-center">
          <div className="text-3xl font-bold tracking-tight text-white">{value}</div>
          <div className="text-sm text-zinc-400">{value === 1 ? "Adult" : "Adults"}</div>
        </div>

        <button
          type="button"
          onClick={increase}
          disabled={disabled || value >= max}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-400/18 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
