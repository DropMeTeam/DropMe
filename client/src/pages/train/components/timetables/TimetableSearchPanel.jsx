import { RefreshCcw, Search } from "lucide-react";

export default function TimetableSearchPanel({
  value,
  onChange,
  onRefresh,
  loading,
  totalCount,
  filteredCount,
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,28,40,0.96)_0%,rgba(11,17,27,0.96)_100%)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Find a saved train</h2>
          <p className="mt-1 text-sm text-white/45">
            Search by train number or train name.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search train number or train name..."
          className="h-12 w-full rounded-2xl border border-white/10 bg-[#09101b] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-400/45"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-white/60">
          Total: {totalCount}
        </span>
        <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-blue-100">
          Showing: {filteredCount}
        </span>
      </div>
    </section>
  );
}
