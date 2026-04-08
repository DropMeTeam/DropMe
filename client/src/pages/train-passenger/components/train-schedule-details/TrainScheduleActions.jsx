import { Link } from "react-router-dom";
import { Ticket } from "lucide-react";

export default function TrainScheduleActions({ id, day }) {
  const bookingPath = `/train-service/${id}/book${day ? `?day=${encodeURIComponent(day)}` : ""}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        to={bookingPath}
        className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#2563ff] to-[#1d4ed8] px-6 py-3.5 text-base font-semibold text-white shadow-[0_14px_40px_rgba(37,99,255,0.35)] transition hover:scale-[1.01] hover:shadow-[0_18px_46px_rgba(37,99,255,0.42)]"
      >
        <Ticket className="h-4 w-4" />
        Book Now
      </Link>
    </div>
  );
}
