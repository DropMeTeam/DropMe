import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Users, TrainFront, ShieldCheck } from "lucide-react";

export default function Landing() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card p-7 lg:p-10">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-semibold tracking-tight lg:text-5xl"
        >
          Share rides. Reduce cost.
          <span className="block text-zinc-300">Or switch to public transport — instantly.</span>
        </motion.h1>

        <p className="mt-4 max-w-xl text-zinc-300">
          DropMe is a trip planning and carpool marketplace: riders request trips, drivers post offers,
          and the platform matches routes using geospatial + time-window constraints.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/plan" className="btn-primary btn">
            Plan a trip <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link to="/register" className="btn-ghost btn">Create account</Link>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <Users className="h-5 w-5" />
            <div className="mt-2 text-sm font-medium">Carpool matching</div>
            <div className="text-xs text-zinc-400">Route + time window ranking.</div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <TrainFront className="h-5 w-5" />
            <div className="mt-2 text-sm font-medium">Transit routes</div>
            <div className="text-xs text-zinc-400">Directions with TRANSIT mode.</div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <ShieldCheck className="h-5 w-5" />
            <div className="mt-2 text-sm font-medium">Trust controls</div>
            <div className="text-xs text-zinc-400">Auth + role-based flows.</div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6">
          <div className="text-sm font-medium text-zinc-200">Product flow</div>
          <div className="mt-1 text-xs text-zinc-400">Plan → Schedule → Choose mode → Match/Route</div>
        </div>

        <div className="border-t border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 p-6">
          <ol className="grid gap-3">
            {[
              { t: "Pickup & destination", d: "Autocomplete + map validation." },
              { t: "Schedule", d: "Pick now or choose a time window." },
              { t: "Mode select", d: "Pool, Private, or Transit." },
              { t: "Execution", d: "Match offers or render transit directions." }
            ].map((x, i) => (
              <li key={x.t} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                <div className="text-xs text-zinc-400">Step {i + 1}</div>
                <div className="mt-1 font-medium">{x.t}</div>
                <div className="mt-1 text-sm text-zinc-300">{x.d}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
