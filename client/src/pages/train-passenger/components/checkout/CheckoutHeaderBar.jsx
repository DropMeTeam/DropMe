import { ChevronLeft, ReceiptText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function CheckoutHeaderBar({
  title,
  description,
  searchPath,
  onBookingsClick,
}) {
  const navigate = useNavigate();

  return (
    <div className="rounded-[26px] border border-white/8 bg-[linear-gradient(90deg,rgba(19,22,31,0.98),rgba(14,17,24,0.96),rgba(11,14,20,0.98))] px-4 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.25)] sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex min-w-0 items-center gap-3 text-center sm:text-left">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <ReceiptText className="h-5 w-5 text-cyan-400" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
              {title}
            </h1>
            <p className="hidden text-xs text-zinc-400 lg:block">{description}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBookingsClick}
          className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-500/15"
        >
          My Bookings
        </button>
      </div>
    </div>
  );
}
