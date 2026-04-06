import { MapPinned, Plus, Sparkles } from "lucide-react";

function InputField({ label, value, onChange, placeholder, disabled = false }) {
  return (
    <label className="grid gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-white/45">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-12 rounded-xl border border-white/8 bg-[#070f1b] px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-400/45 focus:bg-[#0a1422] disabled:cursor-not-allowed disabled:opacity-70"
      />
    </label>
  );
}

function ActiveToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3"
      aria-pressed={checked}
    >
      <span
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-blue-500/90" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
      <span className="text-sm font-medium leading-none text-white/85">
        Active Status
      </span>
    </button>
  );
}

export default function StationFormCard({
  name,
  setName,
  address,
  setAddress,
  lat,
  setLat,
  lng,
  setLng,
  isActive,
  setIsActive,
  pickMode,
  setPickMode,
  geoLoading,
  onSubmit,
}) {
  return (
    <section className="rounded-[24px] border border-white/7 bg-[linear-gradient(180deg,rgba(11,20,33,0.96)_0%,rgba(7,14,25,0.96)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_20px_40px_rgba(0,0,0,0.2)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-white">Add New Station</h2>
          <p className="mt-1 text-sm text-white/35">
            Create and geo-tag a station record.
          </p>
        </div>

        <span className="inline-flex items-center gap-1 rounded-lg border border-white/7 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-white/40">
          <Sparkles className="h-3.5 w-3.5" />
          Manual Entry
        </span>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4">
        <InputField
          label="Station Name"
          value={name}
          onChange={setName}
          placeholder="e.g. Grand Central Terminal"
        />

        <InputField
          label="Address / Location"
          value={address}
          onChange={setAddress}
          placeholder={geoLoading ? "Resolving location..." : "Full street address"}
          disabled={geoLoading}
        />

        

        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <ActiveToggle checked={isActive} onChange={setIsActive} />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPickMode((prev) => !prev)}
              className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
                pickMode
                  ? "border-blue-400/40 bg-blue-500/15 text-blue-100"
                  : "border-white/8 bg-white/[0.03] text-white/75 hover:border-white/15 hover:bg-white/[0.06]"
              }`}
            >
              <MapPinned className="h-4 w-4" />
              {pickMode ? "Click map…" : "Pick on Map"}
            </button>

            <button
              type="submit"
              disabled={geoLoading}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] px-5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              title={geoLoading ? "Wait for location lookup" : "Save station"}
            >
              <Plus className="h-4 w-4" />
              Add Station
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}