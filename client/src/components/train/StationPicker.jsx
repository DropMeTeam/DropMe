export default function StationPicker({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select station",
  disabled = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-300">{label}</label>

      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-white/30 disabled:opacity-60"
      >
        <option value="">{placeholder}</option>

        {options.map((station) => (
          <option key={station._id} value={station._id}>
            {station.name}
          </option>
        ))}
      </select>
    </div>
  );
}