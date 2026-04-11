import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { Bus, Car, LogOut, MapPinned, UserRound, Shield, Users, Caravan, CarTaxiFront, CarTaxiFrontIcon, CarIcon,TrainFront } from "lucide-react";
import logo from "../assets/dropme-logo.jpeg";
import logo1 from "../assets/logoDropme.png";


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
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            to="/"
            className="flex items-center gap-3 font-semibold tracking-tight text-white"
          >
            <span className="flex h-20 w-20 items-center justify-center  bg-white shadow-sm ring-1 ring-white/10">
              <img
                src={logo}
                alt="DropMe logo"
                className="h-30 w-30 object-contain"
              />
            </span>
            <span className="text-[1.65rem] font-extrabold leading-none text-blue-800">
              DropMe
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link to="/plan" className="pill">
              <MapPinned className="h-4 w-4" /> Plan Ride
            </Link>

            {/* Added Carpooling Button */}
            <Link to="/carpooling" className="pill">
              <CarIcon className="h-4 w-4" /> Carpool
            </Link>

            <Link to="/trains" className="pill">
              <TrainFront className="h-4 w-4" /> Train
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

      <footer className="mt-20 border-t border-zinc-800 bg-zinc-950 px-4 py-6 text-zinc-400">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-40 w-40 overflow-hidden rounded  p-1">
                   <img src={logo1} alt="Logo1" className="h-full w-full object-contain" />
                </div>
                
              </div>
              <p className="text-sm leading-relaxed">
                Revolutionizing urban mobility through smart carpooling and real-time public transit solutions.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-4 font-semibold text-white">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/carpooling" className="hover:text-violet-400 transition-colors">Carpooling</Link></li>
                <li><Link to="/trains" className="hover:text-violet-400 transition-colors">Train Schedules</Link></li>
                <li><Link to="/plan" className="hover:text-violet-400 transition-colors">Bus Routes</Link></li>
                <li><Link to="/plan" className="hover:text-violet-400 transition-colors">Plan Journey</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="mb-4 font-semibold text-white">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="#" className="hover:text-violet-400 transition-colors">Help Center</Link></li>
                <li><Link to="#" className="hover:text-violet-400 transition-colors">Safety Guidelines</Link></li>
                <li><Link to="#" className="hover:text-violet-400 transition-colors">Terms of Service</Link></li>
                <li><Link to="#" className="hover:text-violet-400 transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Newsletter/Social */}
            <div>
              <h4 className="mb-4 font-semibold text-white">Stay Connected</h4>
              <p className="mb-4 text-sm">Join our newsletter for transit updates.</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs focus:border-violet-500 focus:outline-none"
                />
                <button className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700">
                  Join
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-800 pt-8 md:flex-row">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">
              © 2026 DropMe Technologies. All Rights Reserved.
            </p>
            <div className="flex gap-6">
              {/* Simple Social Icons placeholders */}
              <div className="h-4 w-4 cursor-pointer hover:text-white transition-colors">𝕏</div>
              <div className="h-4 w-4 cursor-pointer hover:text-white transition-colors">📸</div>
              <div className="h-4 w-4 cursor-pointer hover:text-white transition-colors">in</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}