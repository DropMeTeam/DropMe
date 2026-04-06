import { RefreshCcw, Search } from "lucide-react";

export default function StationSearchBar({ value, onChange, onRefresh, refreshing }) {
  return (
    <div className="mt-4 flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search stations..."
          className="h-11 w-full rounded-2xl border border-white/7 bg-[#08111d] pl-10 pr-4 text-sm text-white outline-none ring-0 transition placeholder:text-white/20 focus:border-blue-400/40 focus:bg-[#0b1422]"
        />
      </div>

      <button
        type="button"
        onClick={onRefresh}
        className="grid h-11 w-11 place-items-center rounded-2xl border border-white/7 bg-[#08111d] text-white/70 transition hover:border-white/15 hover:bg-[#0c1625] hover:text-white"
        title="Refresh stations"
      >
        <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
