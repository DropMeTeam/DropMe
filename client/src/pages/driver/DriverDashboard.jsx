import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function DriverDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/api/driver/dashboard").then((r) => setData(r.data));
  }, []);

  if (!data) return <div className="p-6 text-white">Loading...</div>;

  const { user, driverProfile, rides } = data;

  return (
    <div className="min-h-screen bg-[#060812] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex items-center gap-5">
          <img
            src={user?.avatarUrl ? user.avatarUrl : "https://placehold.co/80x80"}
            alt="avatar"
            className="h-20 w-20 rounded-2xl object-cover border border-white/10"
          />
          <div className="flex-1">
            <div className="text-xl font-semibold">{user?.fullName}</div>
            <div className="text-sm text-white/60">{user?.email}</div>
          </div>

          <Link
            to="/driver/register"
            className="rounded-xl bg-white text-black px-4 py-2 font-semibold hover:opacity-90"
          >
            Driver Registration
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="font-semibold">Registration Status</div>
            <div className="mt-2 text-white/70">
              {driverProfile?.status ? driverProfile.status.toUpperCase() : "NOT SUBMITTED"}
            </div>

            {driverProfile?.driverId && (
              <div className="mt-2 text-sm text-white/60">
                Driver ID: <span className="text-white font-semibold">{driverProfile.driverId}</span>
              </div>
            )}

            <div className="mt-4">
              {driverProfile?.status === "approved" ? (
                <Link
                  to="/driver/add-ride"
                  className="inline-flex rounded-xl bg-white text-black px-4 py-2 font-semibold hover:opacity-90"
                >
                  Add Ride
                </Link>
              ) : (
                <div className="text-sm text-white/50">
                  Add Ride enabled only after approval.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="font-semibold">My Rides</div>
            <div className="mt-4 space-y-3">
              {(rides || []).map((r) => (
                <div key={r._id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-sm text-white/60">
                    {new Date(r.departAt).toLocaleString()}
                  </div>
                  <div className="font-semibold mt-1">
                    {r.origin.label} → {r.destination.label}
                  </div>
                  <div className="text-sm text-white/60 mt-1">
                    Seats: <span className="text-white">{r.seatsAvailable}</span> / {r.seatsTotal}
                    {"  "} | Cost/km: <span className="text-white">LKR {r.costPerKm}</span>
                  </div>
                </div>
              ))}
              {(!rides || rides.length === 0) && (
                <div className="text-sm text-white/50">No rides yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const nav = useNavigate();

<button
  onClick={() => nav("/driver/register")}
  className="rounded-xl bg-white text-black font-semibold px-5 py-3 hover:opacity-90"
>
  Driver Registration
</button>
}
