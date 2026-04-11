import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../state/AuthContext";

import authSideImage from "../../assets/auth/auth-side.png";

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
      setErr(
        e2?.response?.data?.error ||
          e2?.response?.data?.message ||
          "Login failed"
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
          <div className="relative hidden min-h-[560px] md:block">
            <img
              src={authSideImage}
              alt="Travel"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/10" />
          </div>

          {/* right panel */}
          <div className="relative flex min-h-[560px] items-center justify-center bg-[#05070b] px-8 py-10 md:px-12">
           

            <div className="w-full max-w-sm pt-8">
              <div className="text-center">
                <h1 className="text-4xl font-semibold tracking-tight text-white">
                  Log In
                </h1>
                <p className="mt-3 text-sm text-slate-400">
                  Welcome back. Sign in to continue your journey.
                </p>
              </div>

              <form className="mt-8 space-y-5" onSubmit={submit}>
                <div className="relative">
                  <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 8.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-15A2.25 2.25 0 0 1 2.25 15.75v-7.5m19.5 0A2.25 2.25 0 0 0 19.5 6h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-.97 1.857l-7.5 5.25a2.25 2.25 0 0 1-2.56 0l-7.5-5.25a2.25 2.25 0 0 1-.97-1.857V8.25"
                      />
                    </svg>
                  </span>

                  <input
                    className="h-14 w-full rounded-full border border-cyan-400/20 bg-[#111827] pl-14 pr-5 text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-500/10"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V7.875a4.5 4.5 0 1 0-9 0V10.5m-.75 0h10.5A2.25 2.25 0 0 1 19.5 12.75v6A2.25 2.25 0 0 1 17.25 21h-10.5A2.25 2.25 0 0 1 4.5 18.75v-6A2.25 2.25 0 0 1 6.75 10.5Z"
                      />
                    </svg>
                  </span>

                  <input
                    className="h-14 w-full rounded-full border border-cyan-400/20 bg-[#111827] pl-14 pr-5 text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-500/10"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {err ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {err}
                  </div>
                ) : null}

                <button
                  className="h-14 w-full rounded-full bg-cyan-400 text-base font-semibold text-slate-950 transition hover:bg-cyan-300"
                  type="submit"
                >
                  Continue
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-slate-400">
                No account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-cyan-400 transition hover:text-cyan-300"
                >
                  Create one
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}