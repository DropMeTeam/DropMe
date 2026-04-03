export default function JourneySummaryCard({
  trainName = "",
  trainNo = "",
  boardingName = "",
  destinationName = "",
  travelDate = "",
  seats = 1,
  totalFareLkr = 0,
  departureTime = "",
  arrivalTime = "",
  durationLabel = "",
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-5">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {trainNo || "Train"}
      </div>

      <h3 className="mt-1 text-lg font-semibold">
        {trainName || "Unnamed train service"}
      </h3>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="text-xs text-zinc-500">Boarding</div>
          <div className="mt-1 font-medium">{boardingName || "-"}</div>
          <div className="mt-1 text-sm text-zinc-400">
            Departure: {departureTime || "-"}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="text-xs text-zinc-500">Destination</div>
          <div className="mt-1 font-medium">{destinationName || "-"}</div>
          <div className="mt-1 text-sm text-zinc-400">
            Arrival: {arrivalTime || "-"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="text-xs text-zinc-500">Travel date</div>
          <div className="mt-1 font-medium">{travelDate || "-"}</div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="text-xs text-zinc-500">Seats</div>
          <div className="mt-1 font-medium">{seats}</div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="text-xs text-zinc-500">Journey time</div>
          <div className="mt-1 font-medium">{durationLabel || "-"}</div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="text-xs text-zinc-500">Total fare</div>
          <div className="mt-1 font-medium">LKR {Number(totalFareLkr || 0).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}