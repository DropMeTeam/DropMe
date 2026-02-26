import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { Car, LogOut, MapPinned, UserRound, Shield } from "lucide-react";

function isAdmin(role) {
  return role === "ADMIN_TRAIN" || role === "ADMIN_BUS" || role === "ADMIN_PRIVATE";
}

function dashboardPath(role) {
  if (role === "ADMIN_TRAIN") return "/train";
  if (role === "ADMIN_BUS") return "/bus";
  if (role === "ADMIN_PRIVATE") return "/private";
  if (role === "driver") return "/driver";
  return "/rider";
}

export default function Shell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const showAdmin = !!user && isAdmin(user.role);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-950 shadow-soft">
              <Car className="h-5 w-5" />
            </span>
            <span>DropMe</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link to="/plan" className="pill">
              <MapPinned className="h-4 w-4" /> Plan
            </Link>

            {user ? (
              <>
                {showAdmin ? (
                  <button
                    className="pill"
                    onClick={() => nav(dashboardPath(user.role))}
                    type="button"
                  >
                    <Shield className="h-4 w-4" /> Admin
                  </button>
                ) : null}

                <button
                  className="pill"
                  onClick={() => nav(dashboardPath(user.role))}
                  type="button"
                >
                  <UserRound className="h-4 w-4" /> Dashboard
                </button>

                <button className="pill" onClick={logout} type="button" title="Logout">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="pill">
                  Log in
                </Link>
                <Link to="/register" className="pill pill-active">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-10 text-xs text-zinc-400">
        <div className="border-t border-zinc-800 pt-6">
          Built for learning & prototyping. Do not copy third-party branding.
        </div>
      </footer>
    </div>
  );
}
