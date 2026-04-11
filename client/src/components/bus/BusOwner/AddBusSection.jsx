const FEATURE_OPTIONS = ["WiFi", "AC", "CCTV", "USB Charging", "Reclining Seats"];

export default function AddBusSection({
  form,
  setField,
  toggleFeature,
  allowedSeats,
  routes,
  loadingRoutes,
  busPhoto,
  setBusPhoto,
  registrationPhoto,
  setRegistrationPhoto,
  permitPhoto,
  setPermitPhoto,
  submitBus,
  loading,
}) {
  return (
    <section className="mt-6 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#11161f_0%,#0b1017_100%)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Add New Bus</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Register a new vehicle to your fleet portfolio and submit it for approval.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-200">
          Fleet onboarding
        </div>
      </div>

      <form onSubmit={submitBus} className="mt-8 grid gap-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-base font-semibold text-white">Bus Information</h3>

            <div className="mt-5 grid gap-4">
              <Field label="Bus Registration Number">
                <input
                  className="w-full rounded-2xl border border-white/10 bg-[#0d131b] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400"
                  placeholder="Enter plate number"
                  value={form.plateNumber}
                  onChange={(e) => setField("plateNumber", e.target.value)}
                  required
                />
              </Field>

              <Field label="Bus Type">
                <select
                  className="w-full rounded-2xl border border-white/10 bg-[#0d131b] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
                  value={form.busType}
                  onChange={(e) => setField("busType", e.target.value)}
                >
                  <option value="Normal">Normal</option>
                  <option value="Semi-luxury">Semi-luxury</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Expressway">Expressway</option>
                </select>
              </Field>

              <Field label="Bus Color">
                <input
                  className="w-full rounded-2xl border border-white/10 bg-[#0d131b] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400"
                  placeholder="Enter bus color"
                  value={form.color}
                  onChange={(e) => setField("color", e.target.value)}
                />
              </Field>

              <Field label="Seat Capacity">
                <select
                  className="w-full rounded-2xl border border-white/10 bg-[#0d131b] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
                  value={form.seatsTotal}
                  onChange={(e) => setField("seatsTotal", Number(e.target.value))}
                  required
                >
                  {allowedSeats.map((seat) => (
                    <option key={seat} value={seat}>
                      {seat} Seats
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Select Route">
                <select
                  className="w-full rounded-2xl border border-white/10 bg-[#0d131b] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 disabled:opacity-60"
                  value={form.routeId}
                  onChange={(e) => setField("routeId", e.target.value)}
                  required
                  disabled={loadingRoutes}
                >
                  <option value="">
                    {loadingRoutes ? "Loading routes..." : "Select bus route"}
                  </option>

                  {routes.map((route) => (
                    <option key={route._id} value={route._id}>
                      {route.routeNumber} • {route.start?.label} → {route.end?.label} ({route.routeType})
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-base font-semibold text-white">Bus Features</h3>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FEATURE_OPTIONS.map((feature) => {
                const checked = form.features.includes(feature);

                return (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleFeature(feature)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                      checked
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                        : "border-white/10 bg-[#0d131b] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    {feature}
                  </button>
                );
              })}
            </div>

            <div className="mt-8">
              <h3 className="text-base font-semibold text-white">Upload Documents</h3>

              <div className="mt-5 grid gap-4">
                <UploadField
                  label="Bus Photo"
                  file={busPhoto}
                  onChange={(e) => setBusPhoto(e.target.files?.[0] || null)}
                />

                <UploadField
                  label="Bus Registration Photo"
                  file={registrationPhoto}
                  onChange={(e) => setRegistrationPhoto(e.target.files?.[0] || null)}
                />

                <UploadField
                  label="Bus Permit Photo"
                  file={permitPhoto}
                  onChange={(e) => setPermitPhoto(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
          <div>
            <h4 className="text-sm font-semibold text-white">Ready to submit?</h4>
            <p className="mt-1 text-sm text-zinc-400">
              Review the details and send this bus for admin approval.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit for Approval"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-300">{label}</label>
      {children}
    </div>
  );
}

function UploadField({ label, file, onChange }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d131b] p-4">
      <label className="block text-sm font-medium text-zinc-300">{label}</label>

      <input
        type="file"
        accept="image/*"
        onChange={onChange}
        className="mt-3 block w-full text-sm text-zinc-400 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-black hover:file:bg-emerald-400"
      />

      <p className="mt-2 text-xs text-zinc-500">
        {file ? file.name : "No file selected"}
      </p>
    </div>
  );
}