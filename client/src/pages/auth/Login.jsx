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
          <div className="relative hidden min-h-[560px] md:block">
            <img
              src={authSideImage}
              alt="Travel"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/10" />

            <div className="absolute bottom-8 left-8 max-w-[260px] text-white">
             
            </div>
          </div>

          {/* right panel */}
          <div className="relative flex min-h-[560px] items-center justify-center bg-white px-8 py-10 md:px-12">
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
                  Log In
                </h1>
                <p className="mt-3 text-sm text-slate-500">
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
                    className="h-14 w-full rounded-full border border-slate-300 bg-[#d7deea] pl-14 pr-5 text-slate-800 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
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
                    className="h-14 w-full rounded-full border border-slate-300 bg-[#d7deea] pl-14 pr-5 text-slate-800 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {err ? (
                  <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {err}
                  </div>
                ) : null}

                <button
className="h-14 w-full rounded-full bg-black text-base font-semibold text-white transition hover:bg-slate-900"                  type="submit"
                >
                  Continue
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-slate-500">
                No account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-blue-600 transition hover:text-blue-700"
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