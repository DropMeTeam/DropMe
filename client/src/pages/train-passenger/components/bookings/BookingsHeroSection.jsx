import { RefreshCw, TrainFront } from "lucide-react";
import { Link } from "react-router-dom";

export default function BookingsHeroSection({ onRefresh, busy }) {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,#121924_0%,#0b1018_45%,#090c12_100%)] px-5 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] md:px-7 md:py-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.10),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(34,197,94,0.08),transparent_22%)]" />

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
            <TrainFront className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              My Train Bookings
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Manage your upcoming journeys, view ticket details, and track your
              travel history all in one place.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <Link
            to="/train-service"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
          >
            <TrainFront className="h-4 w-4" />
            Back to train search
          </Link>
        </div>
      </div>
    </section>
  );
}
