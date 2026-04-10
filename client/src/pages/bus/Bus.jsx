import { Link } from "react-router-dom";
import { BusFront, Search, Ticket, ArrowRight, ShieldCheck } from "lucide-react";

export default function Bus() {
  return (
    <div className="min-h-screen bg-[#060812] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0b1220] via-[#0a1020] to-[#060812] shadow-2xl">
          <div className="grid gap-8 px-6 py-10 md:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-14">
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-200">
                <BusFront className="h-4 w-4" />
                Smart Bus Travel
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
                Travel across routes with a faster and cleaner bus booking flow.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 md:text-base">
                Search available buses, view route details, continue to booking,
                and manage all your purchased tickets from one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/60">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Route search
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Online checkout
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Ticket history
                </div>
              </div>
            </div>

            <div className="grid gap-4 self-stretch">
              <Link
                to="/buses/search"
                className="group rounded-[28px] border border-white/10 bg-white/5 p-6 transition duration-200 hover:border-cyan-300/30 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-200">
                    <Search className="h-6 w-6" />
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                <h2 className="mt-6 text-2xl font-semibold">Search Buses</h2>
                <p className="mt-2 text-sm leading-7 text-white/65">
                  Browse routes, select buses, check schedules, and continue to
                  the booking process.
                </p>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-cyan-200">
                  Open bus search
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>

              <Link
                to="/buses/tickets"
                className="group rounded-[28px] border border-white/10 bg-white/5 p-6 transition duration-200 hover:border-fuchsia-300/30 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-2xl bg-fuchsia-400/10 p-3 text-fuchsia-200">
                    <Ticket className="h-6 w-6" />
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                <h2 className="mt-6 text-2xl font-semibold">My Bus Tickets</h2>
                <p className="mt-2 text-sm leading-7 text-white/65">
                  See all passenger tickets in one place with booking details,
                  payment status, and travel information.
                </p>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-fuchsia-200">
                  View my tickets
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold text-white">Quick search</div>
            <p className="mt-2 text-sm leading-7 text-white/60">
              Open the search flow and find the best bus option for your route.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold text-white">Ticket access</div>
            <p className="mt-2 text-sm leading-7 text-white/60">
              Keep all your confirmed bus tickets organized inside one page.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Passenger-friendly flow
            </div>
            <p className="mt-2 text-sm leading-7 text-white/60">
              Designed to keep bus booking and ticket viewing simple and direct.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}