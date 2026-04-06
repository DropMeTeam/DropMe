import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../state/AuthContext";

function routeByRole(role) {
  if (role === "ADMIN_TRAIN") return "/train";
  if (role === "ADMIN_BUS") return "/bus";
  if (role === "ADMIN_PRIVATE") return "/private";
  if (role === "driver") return "/driver";
  if (role === "rider") return "/rider";
  return "/plan";
}

export default function Login() {
  const { setUser } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      setUser(data.user);
      nav(routeByRole(data.user?.role), { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2?.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-md">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Log in</h1>
        <p className="mt-1 text-sm text-zinc-400">Use your email + password.</p>

        <form className="mt-6 grid gap-3" onSubmit={submit}>
          <input
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {err ? <div className="text-sm text-red-300">{err}</div> : null}
          <button className="btn-primary btn" type="submit">
            Continue
          </button>
        </form>

        <div className="mt-4 text-sm text-zinc-400">
          No account?{" "}
          <Link to="/register" className="text-white underline">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
