import { ChevronLeft, Ticket } from "lucide-react";
import { Link } from "react-router-dom";

export default function CheckoutHeaderBar({
  title,
  searchPath,
  onBookingsClick,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,#151922_0%,#0d1118_55%,#090c12_100%)] px-5 py-4">
      <Link
        to={searchPath}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Search
      </Link>

      <div className="flex items-center gap-3">
        <Ticket className="h-5 w-5 text-cyan-400" />
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
      </div>

      <button
        type="button"
        onClick={onBookingsClick}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
      >
        My Bookings
      </button>
    </div>
  );
}
