import { CalendarDays, MapPin } from "lucide-react";
import StationPicker from "../../../../components/train/StationPicker";
import CheckoutSeatCounter from "./CheckoutSeatCounter";

export default function CheckoutPreferencesSection({
  stopOptions,
  validDestinationOptions,
  boardingStationId,
  onBoardingChange,
  destinationStationId,
  onDestinationChange,
  travelDate,
  onTravelDateChange,
  seats,
  onSeatsChange,
  minDate,
  minPaymentLkr,
  submitting,
  boardingIndex,
}) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,#171c27_0%,#0e1117_60%,#090b10_100%)] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-3">
        <MapPin className="h-5 w-5 text-cyan-400" />
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Travel Preferences
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Update only the fields your current checkout already supports.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <StationPicker
          label="Boarding station"
          value={boardingStationId}
          onChange={onBoardingChange}
          options={stopOptions}
          placeholder="Select boarding station"
          disabled={submitting}
        />

        <StationPicker
          label="Destination station"
          value={destinationStationId}
          onChange={onDestinationChange}
          options={validDestinationOptions}
          placeholder="Select destination station"
          disabled={submitting || boardingIndex < 0}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-black/30 p-4">
          <label className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
            <CalendarDays className="h-4 w-4" />
            Travel Date
          </label>

          <input
            type="date"
            value={travelDate}
            min={minDate}
            onChange={(e) => onTravelDateChange(e.target.value)}
            disabled={submitting}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
          />
        </div>

        <CheckoutSeatCounter
          value={seats}
          onChange={onSeatsChange}
          min={1}
          max={6}
          disabled={submitting}
        />
      </div>

      <div className="mt-5 rounded-[24px] border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        Stripe-safe minimum total:
        <span className="ml-1 font-semibold">LKR {minPaymentLkr}</span>
      </div>
    </section>
  );
}
