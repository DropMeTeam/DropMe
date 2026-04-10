import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../state/AuthContext";

// update these paths to your real image locations
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
    <div className="relative min-h-screen overflow-hidden bg-[#0b1020]">
      {/* blur background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.20),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),_transparent_28%),linear-gradient(135deg,_#071226_0%,_#0a1120_45%,_#111827_100%)]" />
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute inset-0 backdrop-blur-[18px]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-[12px] border border-white/10 bg-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:grid-cols-2">
          {/* left image */}
          <div className="relative hidden min-h-[600px] md:block">
            <img
              src={authSideImage}
              alt="Travel"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/10" />

            <div className="absolute bottom-8 left-8 max-w-[260px] text-white">
              <p className="text-[22px] font-semibold leading-tight">
                Start smart,
                <br />
                travel beautifully.
              </p>
            </div>
          </div>

          {/* right panel */}
          <div className="relative flex min-h-[600px] items-center justify-center bg-white px-8 py-10 md:px-12">
            {/* logo top-left */}
            <div className="absolute left-8 top-8">
  <img
    src={dropMeLogo}
    alt="DropMe"
    className="h-20 w-auto object-contain"
  />
</div>

            <div className="w-full max-w-sm pt-8">
              <div className="text-center">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
                  Sign Up
                </h1>
                <p className="mt-3 text-sm text-slate-500">
                  Create your account and begin your next ride.
                </p>
              </div>

              <form className="mt-8 space-y-4" onSubmit={submit}>
                <input
                  className="h-14 w-full rounded-full border border-slate-300 bg-[#d7deea] px-5 text-slate-800 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  className="h-14 w-full rounded-full border border-slate-300 bg-[#d7deea] px-5 text-slate-800 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <select
                  className="h-14 w-full rounded-full border border-slate-300 bg-[#d7deea] px-5 text-slate-800 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
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
                  className="h-14 w-full rounded-full border border-slate-300 bg-[#d7deea] px-5 text-slate-800 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                  placeholder="Password (min 8 chars)"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {err ? (
                  <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {err}
                  </div>
                ) : null}

                <button
className="h-14 w-full rounded-full bg-black text-base font-semibold text-white transition hover:bg-slate-900"                  type="submit"
                >
                  Create Account
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-blue-600 transition hover:text-blue-700"
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