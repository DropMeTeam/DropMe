import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { Car, LogOut, MapPinned, UserRound } from "lucide-react";

export default function Shell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

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
                <button className="pill" onClick={() => nav(user.role === "driver" ? "/driver" : "/rider")} type="button">
                  <UserRound className="h-4 w-4" /> Dashboard
                </button>
                <button className="pill" onClick={logout} type="button" title="Logout">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="pill">Log in</Link>
                <Link to="/register" className="pill pill-active">Sign up</Link>
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
          Built for learning & prototyping. Do not copy third‑party branding.
        </div>
      </footer>
    </div>
  );
}
