import { Minus, Plus } from "lucide-react";

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
    <div className="rounded-[24px] border border-white/10 bg-black/30 p-4">
      <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
        Seat Count
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={decrease}
          disabled={disabled || value <= min}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="min-w-[96px] text-center">
          <div className="text-3xl font-semibold text-white">{value}</div>
          <div className="text-sm text-zinc-400">
            {value === 1 ? "seat" : "seats"}
          </div>
        </div>

        <button
          type="button"
          onClick={increase}
          disabled={disabled || value >= max}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-cyan-400/15 text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
