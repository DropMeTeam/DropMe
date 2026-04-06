export default function SeatSelector({
  value = 1,
  onChange,
  min = 1,
  max = 10,
  disabled = false,
}) {
  function handleMinus() {
    if (disabled) return;
    const next = Math.max(min, Number(value || min) - 1);
    onChange?.(next);
  }

  function handlePlus() {
    if (disabled) return;
    const next = Math.min(max, Number(value || min) + 1);
    onChange?.(next);
  }

  function handleInputChange(e) {
    const raw = Number(e.target.value || min);
    const next = Math.max(min, Math.min(max, raw));
    onChange?.(next);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleMinus}
        disabled={disabled || value <= min}
        className="h-11 w-11 rounded-2xl border border-zinc-800 bg-zinc-950 text-lg hover:bg-zinc-900 disabled:opacity-50"
      >
        -
      </button>

      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        className="w-24 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-center text-white outline-none focus:border-white/30"
      />

      <button
        type="button"
        onClick={handlePlus}
        disabled={disabled || value >= max}
        className="h-11 w-11 rounded-2xl border border-zinc-800 bg-zinc-950 text-lg hover:bg-zinc-900 disabled:opacity-50"
      >
        +
      </button>
    </div>
  );
}