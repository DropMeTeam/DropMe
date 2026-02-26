import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../state/AuthContext";

function routeByRole(role) {
  if (role === "ADMIN_TRAIN") return "/train";
  if (role === "ADMIN_BUS") return "/bus";
  if (role === "ADMIN_PRIVATE") return "/private";
  return "/plan";
}

export default function Register() {
  const { setUser } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("rider");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");

    try {
      const { data } = await api.post("/api/auth/register", { name, email, password, role });
      setUser(data.user);
      nav(routeByRole(data.user?.role), { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2?.response?.data?.error || "Registration failed");
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-md">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-zinc-400">Choose your role (rider/driver/admin).</p>

        <form className="mt-6 grid gap-3" onSubmit={submit}>
          <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            {/* keep existing */}
            <option value="rider">Rider</option>
            <option value="driver">Driver</option>

            {/* add admin types */}
            <option value="ADMIN_TRAIN">Train Admin</option>
            <option value="ADMIN_BUS">Bus Admin</option>
            <option value="ADMIN_PRIVATE">Private Vehicle Admin</option>
          </select>

          <input
            className="input"
            placeholder="Password (min 8 chars)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {err ? <div className="text-sm text-red-300">{err}</div> : null}
          <button className="btn-primary btn" type="submit">Create</button>
        </form>

        <div className="mt-4 text-sm text-zinc-400">
          Already have an account?{" "}
          <Link to="/login" className="text-white underline">Log in</Link>
        </div>
      </div>
    </div>
  );
}
