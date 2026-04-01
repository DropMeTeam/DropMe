import { Link } from "react-router-dom";
import { ReceiptText, TrainFront } from "lucide-react";

export default function MyTrainBookingsPage() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-8">
      <div className="flex items-start gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-950">
          <ReceiptText className="h-6 w-6" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold">My train bookings</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            The frontend page is ready, but your booking backend is not implemented yet.
            After you add booking APIs, this page will load the passenger’s reservations here.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
        Next backend phase:
        <div className="mt-2 text-amber-50">
          GET /api/train/bookings/mine
        </div>
      </div>

      <div className="mt-6">
        <Link
          to="/train-service"
          className="inline-flex items-center rounded-2xl border border-zinc-800 px-4 py-2 hover:bg-zinc-900"
        >
          <TrainFront className="mr-2 h-4 w-4" />
          Back to train search
        </Link>
      </div>
    </div>
  );
}