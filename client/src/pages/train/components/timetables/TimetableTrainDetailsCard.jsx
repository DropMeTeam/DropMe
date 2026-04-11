import { BadgeInfo, TrainFront } from "lucide-react";

function InputField({ label, value, onChange, type = "text", min = undefined, disabled = false }) {
  return (
    <label className="grid gap-2 text-sm text-white/70">
      <span>{label}</span>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-12 rounded-2xl border border-white/10 bg-[#09101b] px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-400/45 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function ActiveToggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 pt-6 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="text-sm text-white/75">{checked ? "Active" : "Inactive"}</span>
      <span className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-blue-500" : "bg-white/12"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

export default function TimetableTrainDetailsCard({
  selected,
  trainNo,
  setTrainNo,
  trainName,
  setTrainName,
  seatCapacity,
  setSeatCapacity,
  active,
  setActive,
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,28,40,0.96)_0%,rgba(11,17,27,0.96)_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-blue-100">
            <TrainFront className="h-3.5 w-3.5" />
            Train details
          </div>
          <h2 className="mt-3 text-xl font-semibold text-white">Edit train information</h2>
          <p className="mt-1 text-sm text-white/45">
            Update basic train values alongside the weekly timetable.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/55">
          <BadgeInfo className="h-4 w-4" />
          {selected ? "Editing selected schedule" : "Select a train first"}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1.2fr_1fr_auto]">
        <InputField
          label="Train No"
          value={trainNo}
          onChange={setTrainNo}
          disabled={!selected}
        />
        <InputField
          label="Train Name"
          value={trainName}
          onChange={setTrainName}
          disabled={!selected}
        />
        <InputField
          label="Seat Capacity"
          value={seatCapacity}
          onChange={setSeatCapacity}
          type="number"
          min={1}
          disabled={!selected}
        />
        <div className="flex items-start justify-start">
          <ActiveToggle
            checked={active}
            onChange={setActive}
            disabled={!selected}
          />
        </div>
      </div>
    </section>
  );
}
