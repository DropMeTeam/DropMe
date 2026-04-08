import { CircleAlert } from "lucide-react";

export default function TimetableAlert({ message }) {
  return (
    <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-amber-50 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
        <div>
          <div className="text-sm font-semibold">Status</div>
          <p className="mt-1 text-sm text-amber-100/90">{message}</p>
        </div>
      </div>
    </div>
  );
}
