import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

const VEHICLE_TYPES = [
  { value: "car", label: "Car" },
  { value: "mini_car", label: "Mini Car" },
  { value: "van", label: "Van" },
  { value: "mini_van", label: "Mini Van" },
  { value: "suv", label: "SUV" },
];

export default function DriverRegister() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nic: "",
    address: "",
    age: "",
    licenseNumber: "",
    vehicleType: "car",
    vehicleNumber: "",
    vehicleColor: "",
    seatsTotal: "4",
  });

  const [licenseImage, setLicenseImage] = useState(null);
  const [vehiclePhoto, setVehiclePhoto] = useState(null);

  const seatsNum = useMemo(() => parseInt(String(form.seatsTotal ?? ""), 10), [form.seatsTotal]);
  const ageNum = useMemo(() => parseInt(String(form.age ?? ""), 10), [form.age]);

  const canSubmit = useMemo(() => {
    return (
      form.nic.trim() &&
      form.address.trim() &&
      Number.isFinite(ageNum) &&
      ageNum >= 18 &&
      form.licenseNumber.trim() &&
      form.vehicleType &&
      form.vehicleNumber.trim() &&
      form.vehicleColor.trim() &&
      Number.isFinite(seatsNum) &&
      seatsNum >= 1 &&
      !!licenseImage &&
      !!vehiclePhoto
    );
  }, [form, licenseImage, vehiclePhoto, ageNum, seatsNum]);

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (!canSubmit) {
      alert("Please complete all required fields (including images).");
      return;
    }

    // hard guard (no NaN ever goes to server)
    if (!Number.isFinite(seatsNum) || seatsNum <= 0) {
      alert("Total seats must be a valid number");
      return;
    }
    if (!Number.isFinite(ageNum) || ageNum < 18) {
      alert("Age must be 18+");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();

      // driver
      fd.append("nic", form.nic.trim());
      fd.append("address", form.address.trim());
      fd.append("age", String(ageNum));
      fd.append("licenseNumber", form.licenseNumber.trim());

      // vehicle
      fd.append("vehicleType", form.vehicleType);
      fd.append("vehicleNumber", form.vehicleNumber.trim());
      fd.append("vehicleColor", form.vehicleColor.trim());

      // ✅ server expects totalSeats
      fd.append("totalSeats", String(seatsNum));

      // files (must match multer field names)
      fd.append("licenseImage", licenseImage);
      fd.append("vehiclePhoto", vehiclePhoto);

      await api.post("/api/driver/registration", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Registration submitted ✅ Waiting for admin approval.");
      nav("/driver", { replace: true });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Registration submit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060812] text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Driver Registration</h1>
            <p className="mt-1 text-sm text-white/60">
              Submit driver + vehicle information for private admin approval.
            </p>
          </div>

          <button
            type="button"
            onClick={() => nav("/driver")}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Back
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5"
        >
          {/* Driver details */}
          <div>
            <div className="text-sm font-semibold text-white/90">Driver Details</div>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="NIC" required>
                <input
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
                  value={form.nic}
                  onChange={(e) => setField("nic", e.target.value)}
                  placeholder="2002xxxxxxxxV / 2002xxxxxxxx"
                />
              </Field>

              <Field label="Age" required>
                <input
                  type="number"
                  min="18"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
                  value={form.age}
                  onChange={(e) => setField("age", e.target.value)}
                  placeholder="18+"
                />
              </Field>

              <Field label="Address" required className="md:col-span-2">
                <input
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="Full address"
                />
              </Field>

              <Field label="Driver License Number" required className="md:col-span-2">
                <input
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
                  value={form.licenseNumber}
                  onChange={(e) => setField("licenseNumber", e.target.value)}
                  placeholder="B1234567"
                />
              </Field>

              <Field label="Driver License Image" required className="md:col-span-2">
                <input
                  type="file"
                  accept="image/*"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white/80 outline-none focus:border-white/30"
                  onChange={(e) => setLicenseImage(e.target.files?.[0] || null)}
                />
                {licenseImage && (
                  <div className="mt-2 text-xs text-white/60">Selected: {licenseImage.name}</div>
                )}
              </Field>
            </div>
          </div>

          {/* Vehicle details */}
          <div className="pt-2 border-t border-white/10">
            <div className="text-sm font-semibold text-white/90">Vehicle Details</div>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Vehicle Type" required>
                <select
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
                  value={form.vehicleType}
                  onChange={(e) => setField("vehicleType", e.target.value)}
                >
                  {VEHICLE_TYPES.map((v) => (
                    <option key={v.value} value={v.value} className="bg-[#0B0F19]">
                      {v.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Vehicle Number" required>
                <input
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
                  value={form.vehicleNumber}
                  onChange={(e) => setField("vehicleNumber", e.target.value)}
                  placeholder="CAB-1234"
                />
              </Field>

              <Field label="Vehicle Color" required>
                <input
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
                  value={form.vehicleColor}
                  onChange={(e) => setField("vehicleColor", e.target.value)}
                  placeholder="Black"
                />
              </Field>

              <Field label="Total Seats" required>
                <input
                  type="number"
                  min="1"
                  max="15"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
                  value={form.seatsTotal}
                  onChange={(e) => setField("seatsTotal", e.target.value)}
                />
              </Field>

              <Field label="Vehicle Photo" required className="md:col-span-2">
                <input
                  type="file"
                  accept="image/*"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white/80 outline-none focus:border-white/30"
                  onChange={(e) => setVehiclePhoto(e.target.files?.[0] || null)}
                />
                {vehiclePhoto && (
                  <div className="mt-2 text-xs text-white/60">Selected: {vehiclePhoto.name}</div>
                )}
              </Field>
            </div>
          </div>

          <button
            disabled={!canSubmit || loading}
            className="w-full rounded-xl bg-white text-black font-semibold py-3 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Registration"}
          </button>

          <p className="text-xs text-white/50">
            After approval, the system generates Driver ID like <b>D/2026/14</b> and notifies via email (SMTP must be configured).
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, className = "", children }) {
  return (
    <div className={className}>
      <label className="block text-sm text-white/70 mb-2">
        {label} {required && <span className="text-red-300">*</span>}
      </label>
      {children}
    </div>
  );
}
