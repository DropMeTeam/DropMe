import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

const toneConfig = {
  success: {
    Icon: CheckCircle2,
    wrap: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    icon: "bg-emerald-400/15 text-emerald-300",
  },
  info: {
    Icon: Info,
    wrap: "border-blue-400/20 bg-blue-500/10 text-blue-100",
    icon: "bg-blue-400/15 text-blue-300",
  },
  warning: {
    Icon: AlertTriangle,
    wrap: "border-amber-400/20 bg-amber-500/10 text-amber-100",
    icon: "bg-amber-400/15 text-amber-300",
  },
};

export default function StationAlert({ tone = "warning", message }) {
  const config = toneConfig[tone] || toneConfig.warning;
  const Icon = config.Icon;

  return (
    <div className={`rounded-2xl border px-3 py-3 text-sm ${config.wrap}`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${config.icon}`}>
          <Icon className="h-4 w-4" />
        </div>

        <div>
          <div className="font-medium">System message</div>
          <div className="mt-0.5 text-xs leading-5 text-white/70">{message}</div>
        </div>
      </div>
    </div>
  );
}
