import { ChevronDown } from "lucide-react";
import { DAY_OPTIONS } from "./trainScheduleDetails.utils";

export default function TrainScheduleDaySelector({ value, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-2xl border border-white/10 bg-[#0a1737] px-4 py-3 pr-11 text-base font-semibold text-white outline-none transition hover:border-blue-400/30 focus:border-blue-400/45"
      >
        {!value ? <option value="">Select a day</option> : null}
        {DAY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
    </div>
  );
}
