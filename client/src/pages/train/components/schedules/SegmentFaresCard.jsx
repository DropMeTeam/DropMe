import { Coins } from "lucide-react";

export default function SegmentFaresCard({
  segments,
  stationById,
  segmentFares,
  setSegmentFares,
}) {
  return (
    <section className="min-w-0 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-blue-200" />
        <h3 className="text-base font-semibold text-white">
          Segment Fares Input
        </h3>
      </div>

      <p className="mt-1 text-sm text-white/45">
        Adjacent segment fares in LKR, mapped in route order.
      </p>

      {segments.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-6 text-sm text-white/40">
          Build a valid route first to unlock segment fare inputs.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {segments.map((seg, index) => {
            const fromId = String(seg.fromStationId || seg.fromId || "");
            const toId = String(seg.toStationId || seg.toId || "");
            const fromName = stationById.get(fromId)?.name || "Station";
            const toName = stationById.get(toId)?.name || "Station";
            const key = `${fromId}-${toId}`;

            return (
              <div
                key={key}
                className="min-w-0 rounded-2xl border border-white/8 bg-[#0b111c] p-3"
              >
                <div className="text-sm font-medium leading-6 text-white/80 break-words">
                  {index + 1}. {fromName} → {toName}
                </div>

                <div className="mt-3 flex min-w-0 items-center gap-3">
                  <span className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/45">
                    Fare
                  </span>

                  <input
                    type="number"
                    min={0}
                    placeholder="Price"
                    value={segmentFares[key] || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSegmentFares((prev) => ({ ...prev, [key]: value }));
                    }}
                    className="h-11 min-w-0 w-full flex-1 rounded-xl border border-white/10 bg-[#09101b] px-4 text-sm text-white outline-none transition focus:border-blue-400/45"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}