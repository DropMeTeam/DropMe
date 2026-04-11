import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Clock3, Eye, BellRing, X } from "lucide-react";
import {
  getMyPendingRideReviews,
  getMyGivenReviews,
  getReviewById,
} from "../../services/reviewService";
import RideReviewModal from "../../components/reviews/RideReviewModal";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function deadlineStatus(deadlineAt) {
  if (!deadlineAt) return { label: "Pending", color: "text-zinc-300" };

  const now = Date.now();
  const deadline = new Date(deadlineAt).getTime();
  const diff = deadline - now;

  if (diff <= 0) return { label: "Expired", color: "text-red-400" };
  if (diff <= 6 * 60 * 60 * 1000) return { label: "Expiring Soon", color: "text-amber-400" };
  return { label: "Pending", color: "text-emerald-400" };
}

function moderationLabel(status) {
  if (status === "approved") return "Published";
  if (status === "pending") return "Pending moderation";
  if (status === "hidden") return "Hidden";
  if (status === "rejected") return "Rejected";
  return status || "-";
}

function shortText(text, max = 38) {
  const value = String(text || "");
  if (!value) return "-";
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

export default function RiderReviewsPage() {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState("given");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [showPendingToast, setShowPendingToast] = useState(false);

  const { data: givenData, isLoading: loadingGiven } = useQuery({
    queryKey: ["my-given-reviews"],
    queryFn: getMyGivenReviews,
  });

  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ["my-pending-reviews"],
    queryFn: getMyPendingRideReviews,
  });

  const given = givenData?.reviews || [];
  const pending = pendingData?.pending || [];

  useEffect(() => {
    if (pending.length > 0) {
      setShowPendingToast(true);
    }
  }, [pending.length]);

  function openReviewModal(item) {
    setSelectedReview(null);
    setModalMode("create");
    setSelectedBooking({
      _id: item?._id || item?.bookingId,
      offerSnapshot: {
        driverName: item?.offerSnapshot?.driverName || item?.driverName || "your driver",
      },
    });
    setReviewModalOpen(true);
  }

  async function openViewModal(item) {
    try {
      const result = await getReviewById(item._id);
      const review = result?.review;

      if (!review) return;

      setSelectedBooking({
        _id: review.bookingId,
        offerSnapshot: {
          driverName: review.driverName || "your driver",
        },
      });

      setSelectedReview(review);
      setModalMode(review.isEditable ? "edit" : "view");
      setReviewModalOpen(true);
    } catch (err) {
      console.error("Failed to load review details", err);
    }
  }

  function handlePendingToastClick() {
    setTab("pending");
    setShowPendingToast(false);
  }

  async function handleReviewSubmitted() {
    setReviewModalOpen(false);
    setSelectedBooking(null);
    setSelectedReview(null);

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["my-pending-reviews"] }),
      queryClient.invalidateQueries({ queryKey: ["my-given-reviews"] }),
    ]);

    setTab("given");
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] border border-zinc-800/50 bg-zinc-900/40 p-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-[#B8860B]/10 flex items-center justify-center text-[#B8860B]">
            <Star size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Your Reviews</h1>
            <p className="text-sm text-zinc-400">
              Manage submitted ratings and rides still eligible for feedback.
            </p>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => setTab("given")}
            className={`rounded-xl px-5 py-3 text-xs font-black uppercase tracking-[0.18em] transition ${
              tab === "given"
                ? "bg-[#B8860B] text-black"
                : "border border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-[#B8860B]/40"
            }`}
          >
            Reviews Given
          </button>

          <button
            onClick={() => setTab("pending")}
            className={`rounded-xl px-5 py-3 text-xs font-black uppercase tracking-[0.18em] transition ${
              tab === "pending"
                ? "bg-[#B8860B] text-black"
                : "border border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-[#B8860B]/40"
            }`}
          >
            Pending Reviews
          </button>
        </div>
      </div>

      {tab === "given" && (
        <div className="rounded-[2rem] border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/30">
                <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                  <th className="px-6 py-4">Ride ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">From</th>
                  <th className="px-6 py-4">To</th>
                  <th className="px-6 py-4">Driver</th>
                  <th className="px-6 py-4">Overall</th>
                  <th className="px-6 py-4">Comment</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingGiven ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                      Loading reviews...
                    </td>
                  </tr>
                ) : given.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                      No submitted reviews found.
                    </td>
                  </tr>
                ) : (
                  given.map((item) => (
                    <tr key={item._id} className="border-t border-zinc-800/50 text-zinc-200">
                      <td className="px-6 py-4 font-mono text-xs">
                        {item.bookingShortId || item.bookingId}
                      </td>
                      <td className="px-6 py-4">{formatDate(item.date)}</td>
                      <td className="px-6 py-4" title={item.from}>
                        {shortText(item.from)}
                      </td>
                      <td className="px-6 py-4" title={item.to}>
                        {shortText(item.to)}
                      </td>
                      <td className="px-6 py-4">{item.driverName}</td>
                      <td className="px-6 py-4">{item.overallRating}/5</td>
                      <td
                        className="px-6 py-4 max-w-[240px] truncate"
                        title={item.commentFull || item.commentPreview}
                      >
                        {item.commentPreview}
                      </td>
                      <td className="px-6 py-4">{moderationLabel(item.moderationStatus)}</td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => openViewModal(item)}
                          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-[#B8860B]/40"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "pending" && (
        <div className="rounded-[2rem] border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/30">
                <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                  <th className="px-6 py-4">Ride ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">From</th>
                  <th className="px-6 py-4">To</th>
                  <th className="px-6 py-4">Driver</th>
                  <th className="px-6 py-4">Completed</th>
                  <th className="px-6 py-4">Deadline</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingPending ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                      Loading pending reviews...
                    </td>
                  </tr>
                ) : pending.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                      No pending reviews found.
                    </td>
                  </tr>
                ) : (
                  pending.map((item) => {
                    const state = deadlineStatus(item.reviewDeadlineAt);

                    return (
                      <tr key={item.bookingId} className="border-t border-zinc-800/50 text-zinc-200">
                        <td className="px-6 py-4 font-mono text-xs">
                          {item.bookingShortId || item.bookingId}
                        </td>
                        <td className="px-6 py-4">{formatDate(item.date)}</td>
                        <td className="px-6 py-4" title={item.from}>
                          {shortText(item.from)}
                        </td>
                        <td className="px-6 py-4" title={item.to}>
                          {shortText(item.to)}
                        </td>
                        <td className="px-6 py-4">{item.driverName}</td>
                        <td className="px-6 py-4">{formatDate(item.rideCompletedAt)}</td>
                        <td className="px-6 py-4">{formatDate(item.reviewDeadlineAt)}</td>
                        <td className={`px-6 py-4 font-semibold ${state.color}`}>
                          {state.label}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            disabled={state.label === "Expired"}
                            onClick={() => openReviewModal(item)}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#B8860B] px-3 py-2 text-xs font-black text-black disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Clock3 size={14} />
                            Give Review
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPendingToast && pending.length > 0 ? (
        <div className="fixed bottom-6 right-6 z-[900] max-w-sm rounded-2xl border border-[#B8860B]/30 bg-[#0b0b0d] p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-10 w-10 rounded-xl bg-[#B8860B]/10 flex items-center justify-center text-[#B8860B]">
              <BellRing size={18} />
            </div>

            <div className="flex-1">
              <p className="text-sm font-black text-[#B8860B]">
                Pending reviews available
              </p>
              <p className="mt-1 text-sm text-zinc-300 leading-relaxed">
                You have {pending.length} pending ride review{pending.length > 1 ? "s" : ""}. Do you want to rate now?
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handlePendingToastClick}
                  className="rounded-lg bg-[#B8860B] px-3 py-2 text-xs font-black uppercase tracking-wider text-black"
                >
                  Open Pending
                </button>

                <button
                  type="button"
                  onClick={() => setShowPendingToast(false)}
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-black uppercase tracking-wider text-zinc-300"
                >
                  Later
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPendingToast(false)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : null}

      <RideReviewModal
        open={reviewModalOpen}
        booking={selectedBooking}
        reviewData={selectedReview}
        mode={modalMode}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedReview(null);
          setSelectedBooking(null);
        }}
        onSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}