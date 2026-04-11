import { Link, useSearchParams } from "react-router-dom";
import { XCircle, ArrowLeft, Search, Ticket } from "lucide-react";

export default function BusCheckoutCancel() {
  const [sp] = useSearchParams();
  const bookingId = sp.get("bookingId");

  return (
    <div className="min-h-screen bg-[#060812] px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-[30px] border border-red-400/20 bg-[linear-gradient(145deg,#0e121c_0%,#080b12_100%)] shadow-[0_30px_50px_rgba(0,0,0,0.6)]">
          <div className="border-b border-red-400/20 bg-[#05080f] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
                <XCircle className="h-7 w-7" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white">Payment Cancelled</h1>
                <p className="mt-1 text-sm text-white/55">
                  Your bus ticket payment was not completed.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-4 text-red-100">
              <p className="text-sm leading-7">
                The checkout process was cancelled before payment confirmation.
                No ticket was successfully completed from this step.
              </p>

              {bookingId ? (
                <p className="mt-3 text-xs text-red-100/70">
                  Booking reference: <span className="font-mono">{bookingId}</span>
                </p>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">Search again</div>
                <p className="mt-2 text-sm leading-7 text-white/60">
                  Go back to bus search and select another route or bus.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">Retry later</div>
                <p className="mt-2 text-sm leading-7 text-white/60">
                  You can retry checkout later after reviewing your trip details.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">View tickets</div>
                <p className="mt-2 text-sm leading-7 text-white/60">
                  Open your ticket page to check already confirmed bookings.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/buses/search"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:opacity-90"
              >
                <Search className="h-4 w-4" />
                Back to Search Buses
              </Link>

              <Link
                to="/buses/tickets"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white hover:bg-white/10"
              >
                <Ticket className="h-4 w-4" />
                My Bus Tickets
              </Link>

              <Link
                to="/buses"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Bus Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}