import { MapPin, Trash2 } from "lucide-react";

function getStatusMeta(isActive) {
  if (isActive) {
    return {
      label: "Operational",
      badge: "border-emerald-400/20 bg-emerald-500/12 text-emerald-300",
      rail: "from-emerald-400 to-cyan-400",
    };
  }

  return {
    label: "Inactive",
    badge: "border-rose-400/20 bg-rose-500/12 text-rose-300",
    rail: "from-rose-400 to-orange-400",
  };
}

export default function StationCard({ station, onDelete }) {
  const status = getStatusMeta(station?.isActive);

  return (
    <article className="group relative overflow-hidden rounded-[22px] border border-white/7 bg-[linear-gradient(180deg,rgba(9,17,28,0.95)_0%,rgba(8,14,24,0.95)_100%)] p-3.5 transition hover:border-white/12 hover:bg-[linear-gradient(180deg,rgba(11,20,33,0.98)_0%,rgba(8,15,26,0.98)_100%)]">
      <span className={`absolute inset-y-3 left-0.5 w-[3px] rounded-full bg-gradient-to-b ${status.rail}`} />

      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">{station?.name || "Unnamed station"}</h3>

          <div className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/42">
            {station?.address || "No address provided"}
          </div>
        </div>

        <span className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${status.badge}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 pl-2">
        <div className="flex min-w-0 items-center gap-2 text-[11px] text-white/40">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-white/35" />
          <span className="truncate">
            {Number(station?.location?.lat || 0).toFixed(5)}° N &nbsp;&nbsp; {Number(station?.location?.lng || 0).toFixed(5)}° E
          </span>
        </div>

        <button
          type="button"
          onClick={() => onDelete(station._id)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] px-3 text-xs font-medium text-white/70 transition hover:border-rose-400/25 hover:bg-rose-500/10 hover:text-rose-200"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </article>
  );
}
