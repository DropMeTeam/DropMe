import { useState } from "react";
import { api } from "../../lib/api";
import { useNavigate } from "react-router-dom";

export default function DriverRegistrationPage() {
  const nav = useNavigate();
  const [msg, setMsg] = useState("");

  const [nic, setNic] = useState("");
  const [address, setAddress] = useState("");
  const [age, setAge] = useState("");
  const [licenseNo, setLicenseNo] = useState("");

  const [licenseImage, setLicenseImage] = useState(null);

  const [vehicleType, setVehicleType] = useState("car");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [seatsTotal, setSeatsTotal] = useState("");
  const [vehiclePhoto, setVehiclePhoto] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setMsg("");

    try {
      const fd = new FormData();
      fd.append("nic", nic);
      fd.append("address", address);
      fd.append("age", age);
      fd.append("licenseNo", licenseNo);

      fd.append("vehicleType", vehicleType);
      fd.append("vehicleNumber", vehicleNumber);
      fd.append("vehicleColor", vehicleColor);
      fd.append("seatsTotal", seatsTotal);

      if (licenseImage) fd.append("licenseImage", licenseImage);
      if (vehiclePhoto) fd.append("vehiclePhoto", vehiclePhoto);

      await api.post("/api/driver-registration/submit", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg("Submitted. Status: pending (wait for ADMIN_PRIVATE approval).");
      setTimeout(() => nav("/driver"), 600);
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Submit failed");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card p-6">
        <h1 className="text-xl font-semibold">Driver Registration</h1>
        <p className="mt-1 text-sm text-zinc-400">Complete your driver and vehicle profile.</p>

        {msg ? (
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-200">
            {msg}
          </div>
        ) : null}

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm text-zinc-300">
              NIC
              <input className="input" value={nic} onChange={(e) => setNic(e.target.value)} required />
            </label>

            <label className="grid gap-1 text-sm text-zinc-300">
              Age
              <input className="input" type="number" min="16" value={age} onChange={(e) => setAge(e.target.value)} required />
            </label>

            <label className="grid gap-1 text-sm text-zinc-300 md:col-span-2">
              Address
              <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </label>

            <label className="grid gap-1 text-sm text-zinc-300">
              License Number
              <input className="input" value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} required />
            </label>

            <label className="grid gap-1 text-sm text-zinc-300">
              License Image
              <input type="file" accept="image/*" onChange={(e) => setLicenseImage(e.target.files?.[0] || null)} />
            </label>
          </div>

          <hr className="border-zinc-800" />

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm text-zinc-300">
              Vehicle Type
              <select className="input" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                <option value="car">car</option>
                <option value="mini car">mini car</option>
                <option value="van">van</option>
                <option value="mini van">mini van</option>
                <option value="suv">suv</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm text-zinc-300">
              Vehicle Number
              <input className="input" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} required />
            </label>

            <label className="grid gap-1 text-sm text-zinc-300">
              Vehicle Color
              <input className="input" value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} required />
            </label>

            <label className="grid gap-1 text-sm text-zinc-300">
              Total Seats
              <input className="input" type="number" min="1" value={seatsTotal} onChange={(e) => setSeatsTotal(e.target.value)} required />
            </label>

            <label className="grid gap-1 text-sm text-zinc-300 md:col-span-2">
              Vehicle Photo
              <input type="file" accept="image/*" onChange={(e) => setVehiclePhoto(e.target.files?.[0] || null)} />
            </label>
          </div>

          <div className="flex gap-2">
            <button className="pill pill-active" type="submit">Submit</button>
            <button className="pill" type="button" onClick={() => nav("/driver")}>Back</button>
          </div>
        </form>
      </div>
    </div>
  );
}
