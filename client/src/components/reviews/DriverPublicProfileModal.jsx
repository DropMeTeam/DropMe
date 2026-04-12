import { useEffect, useState } from "react";
import {
  X,
  Mail,
  Phone,
  ShieldCheck,
  Car,
  Users,
  ChevronDown,
} from "lucide-react";
import {
  getDriverPublicProfile,
  getDriverPublicReviews,
} from "../../services/reviewService";

function Stars({ value = 0, size = "text-sm" }) {
  const filled = Math.round(Number(value || 0));

  return (
    <div className={`flex gap-1 ${size}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={i < filled ? "text-yellow-400" : "text-zinc-700"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function MetricPill({ label, value }) {
  const filled = Math.round(Number(value || 0));

  return (
    <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-black/30 px-4 py-2">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </span>

      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={i < filled ? "text-yellow-400" : "text-zinc-700"}
          >
            ★
          </span>
        ))}
      </div>

      <span className="text-sm font-bold text-white">
        {Number(value || 0).toFixed(1)}
      </span>
    </div>
  );
}

function ReviewCard({ review }) {
  const name = review?.reviewer?.name || "Passenger";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {review?.reviewer?.avatarUrl ? (
            <img
              src={review.reviewer.avatarUrl}
              alt={name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B8860B]/15 text-xs font-bold text-[#B8860B]">
              {initials}
            </div>
          )}

          <div>
            <div className="text-sm font-semibold text-white">{name}</div>
            <div className="text-xs text-zinc-500">
              {review?.createdAt ? new Date(review.createdAt).toLocaleString() : "-"}
            </div>
          </div>
        </div>

        <Stars value={review?.overallRating || 0} />
      </div>

      <p className="text-sm leading-relaxed text-zinc-300">
        {review?.comment || "No comment provided."}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-zinc-400 sm:grid-cols-4">
        <div>Cleanliness: {review?.cleanlinessRating || 0}/5</div>
        <div>Punctuality: {review?.punctualityRating || 0}/5</div>
        <div>Behavior: {review?.behaviorRating || 0}/5</div>
        <div>Overall: {review?.overallRating || 0}/5</div>
      </div>
    </div>
  );
}

export default function DriverPublicProfileModal({ open, driverId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !driverId) return;

    let ignore = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const data = await getDriverPublicProfile(driverId);

        if (ignore) return;

        setProfile(data);
        setReviews(data?.latestReviews || []);
        setHasMore(Boolean(data?.hasMore));
      } catch (err) {
        if (ignore) return;

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load driver profile"
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [open, driverId]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  async function loadMore() {
    try {
      setLoadingMore(true);

      const data = await getDriverPublicReviews(driverId, {
        offset: reviews.length,
        limit: 6,
      });

      setReviews((prev) => [...prev, ...(data?.reviews || [])]);
      setHasMore(Boolean(data?.hasMore));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load more reviews"
      );
    } finally {
      setLoadingMore(false);
    }
  }

  if (!open) return null;

  const driver = profile?.driver;
  const vehicle = profile?.vehicle;
  const stats = profile?.stats;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-zinc-800 bg-[#0b0b0d] p-5 shadow-2xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Driver Profile
            </h2>
            <p className="text-sm text-zinc-400">
              Driver details, average ratings, and latest passenger feedback
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-700 p-2 text-zinc-300 hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-zinc-300">
            Loading driver profile...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">
            {error}
          </div>
        ) : !profile ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-zinc-300">
            Driver profile not found.
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[2rem] border border-zinc-800 bg-[#111] p-6">
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    {driver?.avatarUrl ? (
                      <img
                        src={driver.avatarUrl}
                        alt={driver?.name || "Driver"}
                        className="h-28 w-28 rounded-full border-4 border-green-500/20 object-cover"
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold text-white">
                        {driver?.name?.[0] || "D"}
                      </div>
                    )}

                    {driver?.verified ? (
                      <span className="absolute bottom-0 right-0 rounded-full border border-[#111] bg-green-600 px-3 py-1 text-[10px] font-black uppercase text-white">
                        Verified
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-2xl font-bold text-white">{driver?.name || "-"}</h3>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <MetricPill label="Overall" value={stats?.overallAvg || 0} />
                    <MetricPill label="Clean" value={stats?.cleanlinessAvg || 0} />
                    <MetricPill label="Behavior" value={stats?.behaviorAvg || 0} />
                    <MetricPill label="Punctual" value={stats?.punctualityAvg || 0} />
                  </div>
                </div>

                <div className="space-y-4 border-t border-zinc-800 pt-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black/30 p-4">
                      <Mail className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm text-zinc-300">{driver?.email || "N/A"}</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black/30 p-4">
                      <Phone className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm text-zinc-300">{driver?.contactNo || "N/A"}</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black/30 p-4">
                      <ShieldCheck className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm text-zinc-300">
                        License: {driver?.licenseNo || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black/30 p-4">
                      <Users className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm text-zinc-300">
                        {stats?.totalReviews || 0} reviews
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-zinc-800 bg-[#111] p-6">
                <h3 className="mb-4 text-center text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">
                  Vehicle Information
                </h3>

                <div className="overflow-hidden rounded-3xl border border-zinc-800">
                  {vehicle?.photoUrl ? (
                    <img
                      src={vehicle.photoUrl}
                      alt={vehicle?.number || "Vehicle"}
                      className="h-[260px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-[260px] items-center justify-center bg-zinc-900 text-zinc-500">
                      No vehicle image
                    </div>
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/30 p-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      Plate
                    </span>
                    <span className="font-mono text-lg font-black text-[#B8860B]">
                      {vehicle?.number || "N/A"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-center">
                      <Car className="mx-auto mb-2 h-4 w-4 text-zinc-400" />
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        Type
                      </div>
                      <div className="mt-1 text-sm font-semibold uppercase text-zinc-200">
                        {vehicle?.type || "N/A"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-center">
                      <Users className="mx-auto mb-2 h-4 w-4 text-zinc-400" />
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        Seats
                      </div>
                      <div className="mt-1 text-sm font-semibold uppercase text-zinc-200">
                        {vehicle?.seatsTotal || 0} Seats
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      Color
                    </div>
                    <div className="mt-1 text-sm font-semibold uppercase text-zinc-200">
                      {vehicle?.color || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border border-zinc-800 bg-[#111] p-6">
              <div className="mb-6">
                <h3 className="text-lg font-black text-white">Passenger Feedback</h3>
                <p className="text-sm text-zinc-500">
                  Latest approved and visible reviews
                </p>
              </div>

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-800 bg-black/30 p-6 text-center text-zinc-400">
                    No public reviews yet.
                  </div>
                ) : (
                  reviews.map((review) => <ReviewCard key={review._id} review={review} />)
                )}
              </div>

              {hasMore ? (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/10 disabled:opacity-60"
                  >
                    <ChevronDown size={16} />
                    {loadingMore ? "Loading..." : "See more feedback"}
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}