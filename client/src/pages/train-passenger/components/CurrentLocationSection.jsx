import { LocateFixed } from "lucide-react";

export default function CurrentLocationSection({
  locating,
  onUseMyLocation,
}) {
  return (
    <section className="rounded-none border border-cyan-500/15 bg-[#071325] p-5 shadow-[0_0_30px_rgba(0,180,255,0.08)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
            Current Location
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">
            Use my current location
          </h3>
        </div>

        <button
          type="button"
          onClick={onUseMyLocation}
          disabled={locating}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/8 text-cyan-300 transition hover:bg-cyan-400/15 disabled:opacity-60"
          title="Use my location"
        >
          <LocateFixed className="h-5 w-5" />
        </button>
      </div>

      <button
        type="button"
        onClick={onUseMyLocation}
        disabled={locating}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-base font-semibold text-[#04111f] transition hover:brightness-110 disabled:opacity-60"
      >
        <LocateFixed className="h-5 w-5" />
        {locating ? "Locating..." : "Click to get location"}
      </button>
    </section>
  );
}