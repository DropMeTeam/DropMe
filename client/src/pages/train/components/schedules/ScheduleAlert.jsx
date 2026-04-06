import { AlertCircle } from "lucide-react";

export default function ScheduleAlert({ message }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-300/18 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 shadow-[0_10px_30px_rgba(245,158,11,0.08)]">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
