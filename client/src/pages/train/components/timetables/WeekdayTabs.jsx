export default function WeekdayTabs({ days, activeDay, onChange }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {days.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => onChange(day)}
          className={`inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-medium transition ${
            activeDay === day
              ? "bg-blue-500/20 text-blue-100 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.35)]"
              : "border border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          {day}
        </button>
      ))}
    </div>
  );
}
