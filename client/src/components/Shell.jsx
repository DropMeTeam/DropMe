import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import {
  Bus,
  Car,
  LogOut,
  MapPinned,
  UserRound,
  Shield,
  TrainFront,
} from "lucide-react";

function isAdmin(role) {
  return role === "ADMIN_TRAIN" || role === "ADMIN_BUS" || role === "ADMIN_PRIVATE";
}

function dashboardPath(role) {
  if (role === "ADMIN_TRAIN") return "/train";
  if (role === "ADMIN_BUS") return "/bus";
  if (role === "ADMIN_PRIVATE") return "/private";
  if (role === "BUS_OWNER") return "/owner";
  if (role === "driver") return "/driver";
  return "/rider";
}

export default function Shell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const showAdmin = !!user && isAdmin(user.role);
  const isBusOwner = user?.role === "BUS_OWNER";

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

            <Link to="/trains" className="pill">
              <TrainFront className="h-4 w-4" /> Train
            </Link>

            <Link to="/buses" className="pill">
              <Bus className="h-4 w-4" /> Bus
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

                {isBusOwner ? (
                  <button
                    className="pill"
                    onClick={() => nav("/owner")}
                    type="button"
                  >
                    <Bus className="h-4 w-4" /> My Fleet
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

      <main className="mx-auto w-full max-w-[1800px] px-3 py-4 md:px-4 xl:px-5">
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