import { Clock3, GitBranch, Map, Route } from "lucide-react";
import RouteMapPanel from "./RouteMapPanel";

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,28,40,0.94)_0%,rgba(10,16,25,0.94)_100%)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.26)]">
      <div className="flex items-center gap-2 text-white/45">
        <Icon className="h-4 w-4 text-blue-200" />
        <span className="text-xs uppercase tracking-[0.16em]">{label}</span>
      </div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}

export default function RoutePreviewPanel({ stopsOrdered, polyline, totalKm, totalMin, stopCount, segmentCount }) {
  return (
    <aside className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,28,40,0.96)_0%,rgba(10,16,25,0.96)_100%)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.32)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-blue-200/55">Route preview</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Current rail path</h2>
          
        </div>
      </div>

      <RouteMapPanel stopsOrdered={stopsOrdered} polyline={polyline} height={650} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
        <MetricCard icon={Map} label="Total Distance" value={`${totalKm} km`} />
        <MetricCard icon={Clock3} label="Total Time" value={`${totalMin} min`} />
        <MetricCard icon={Route} label="Stops Chosen" value={stopCount} />
        <MetricCard icon={GitBranch} label="Segments" value={segmentCount} />
      </div>
    </aside>
  );
}
