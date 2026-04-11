import { ChevronLeft, ReceiptText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function TrainScheduleTopBar() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:border-blue-400/40 hover:bg-white/10"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <Link
        to="/train-service/bookings"
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#07112b] px-4 py-2.5 text-sm font-medium text-white/80 transition hover:border-blue-400/35 hover:bg-[#0b1738] hover:text-white"
      >
        <ReceiptText className="h-4 w-4" />
        My bookings
      </Link>
    </div>
  );
}
