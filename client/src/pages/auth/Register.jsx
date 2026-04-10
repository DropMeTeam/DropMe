import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../state/AuthContext";

import authSideImage from "../../assets/auth/auth-side.jpg";
import dropMeLogo from "../../assets/auth/dropme-logo.jpeg";

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
      const { data } = await api.post("/api/auth/register", {
        name,
        email,
        password,
        role,
      });
      setUser(data.user);
      nav(routeByRole(data.user?.role), { replace: true });
    } catch (e2) {
      setErr(
        e2?.response?.data?.message ||
          e2?.response?.data?.error ||
          "Registration failed"
      );
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-110px)] overflow-hidden">
      {/* black blur background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.10),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(135deg,_#000000_0%,_#020617_50%,_#000000_100%)]" />
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute inset-0 backdrop-blur-[16px]" />
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-110px)] items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-[12px] border border-white/10 bg-black/30 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl md:grid-cols-2">
          {/* left image */}
          <div className="relative hidden min-h-[600px] md:block">
            <img
              src={authSideImage}
              alt="Travel"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/10" />
          </div>

          {/* right panel */}
          <div className="relative flex min-h-[600px] items-center justify-center bg-[#05070b] px-8 py-10 md:px-12">
            <div className="absolute left-8 top-8">
             
            </div>

            <div className="w-full max-w-sm pt-8">
              <div className="text-center">
                <h1 className="text-4xl font-semibold tracking-tight text-white">
                  Sign Up
                </h1>
                <p className="mt-3 text-sm text-slate-400">
                  Create your account and begin your next ride.
                </p>
              </div>

              <form className="mt-8 space-y-4" onSubmit={submit}>
                <input
                  className="h-14 w-full rounded-full border border-cyan-400/20 bg-[#111827] px-5 text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-500/10"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  className="h-14 w-full rounded-full border border-cyan-400/20 bg-[#111827] px-5 text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-500/10"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <select
                  className="h-14 w-full rounded-full border border-cyan-400/20 bg-[#111827] px-5 text-white outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-500/10"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="rider">Rider</option>
                  <option value="driver">Driver</option>
                  <option value="ADMIN_TRAIN">Train Admin</option>
                  <option value="ADMIN_BUS">Bus Admin</option>
                  <option value="ADMIN_PRIVATE">Private Vehicle Admin</option>
                </select>

                <input
                  className="h-14 w-full rounded-full border border-cyan-400/20 bg-[#111827] px-5 text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-500/10"
                  placeholder="Password (min 8 chars)"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {err ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {err}
                  </div>
                ) : null}

                <button
                  className="h-14 w-full rounded-full bg-cyan-400 text-base font-semibold text-slate-950 transition hover:bg-cyan-300"
                  type="submit"
                >
                  Create Account
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-slate-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-cyan-400 transition hover:text-cyan-300"
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}