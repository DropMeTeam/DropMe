function InputField({ label, value, onChange, type = "text", min, disabled }) {
  return (
    <label className="grid gap-2 text-sm text-white/70">
      <span>{label}</span>
      <input
        type={type}
        min={min}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-2xl border border-white/10 bg-[#09101b] px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-400/45 disabled:cursor-not-allowed disabled:opacity-55"
      />
    </label>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 pt-6 disabled:cursor-not-allowed disabled:opacity-55"
    >
      <span className="text-sm text-white/75">{checked ? "Active" : "Inactive"}</span>
      <span className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-blue-500" : "bg-white/12"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

export default function TrainMetaEditorCard({
  trainNo,
  setTrainNo,
  trainName,
  setTrainName,
  seatCapacity,
  setSeatCapacity,
  active,
  setActive,
  disabled,
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,28,40,0.96)_0%,rgba(11,17,27,0.96)_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Train Details</h2>
          <p className="mt-1 text-sm text-white/45">
            Update the core train info for the selected schedule.
          </p>
        </div>
        {!disabled ? null : (
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/45">
            Select a train to edit
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1.2fr_1fr_auto]">
        <InputField label="Train No" value={trainNo} onChange={setTrainNo} disabled={disabled} />
        <InputField label="Train Name" value={trainName} onChange={setTrainName} disabled={disabled} />
        <InputField
          label="Seat Capacity"
          value={seatCapacity}
          onChange={setSeatCapacity}
          type="number"
          min={1}
          disabled={disabled}
        />
        <div className="flex items-start justify-start">
          <Toggle checked={active} onChange={setActive} disabled={disabled} />
        </div>
      </div>
    </section>
  );
}
