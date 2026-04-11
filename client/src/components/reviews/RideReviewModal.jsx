import { useEffect, useMemo, useState } from "react";
import { Star, X } from "lucide-react";
import { createRideReview, updateRideReview } from "../../services/reviewService";

function StarRating({ value, onChange, size = 26, disabled = false }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;

        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(star)}
            className="transition-transform hover:scale-110 disabled:cursor-default disabled:hover:scale-100"
          >
            <Star
              size={size}
              className={active ? "fill-yellow-400 text-yellow-400" : "text-zinc-500"}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function RideReviewModal({
  open,
  onClose,
  booking,
  reviewData = null,
  mode = "create", // create | edit | view
  onSubmitted,
}) {
  const isViewOnly = mode === "view";
  const isEditMode = mode === "edit";

  const [overallRating, setOverallRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [behaviorRating, setBehaviorRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const driverName = useMemo(() => {
    return (
      reviewData?.driverName ||
      booking?.offerSnapshot?.driverName ||
      "your driver"
    );
  }, [booking, reviewData]);

  useEffect(() => {
    if (!open) return;

    setOverallRating(reviewData?.overallRating || 0);
    setCleanlinessRating(reviewData?.cleanlinessRating || 0);
    setPunctualityRating(reviewData?.punctualityRating || 0);
    setBehaviorRating(reviewData?.behaviorRating || 0);
    setReviewText(reviewData?.originalText || reviewData?.sanitizedText || "");
    setError("");
  }, [open, reviewData]);

  if (!open || (!booking && !reviewData)) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (isViewOnly) {
      onClose?.();
      return;
    }

    if (!overallRating) {
      setError("Please select the overall rating");
      return;
    }

    if (!cleanlinessRating || !punctualityRating || !behaviorRating) {
      setError("Please rate cleanliness, punctuality, and behavior");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      if (isEditMode && reviewData?._id) {
        await updateRideReview(reviewData._id, {
          overallRating,
          cleanlinessRating,
          punctualityRating,
          behaviorRating,
          reviewText,
        });
      } else {
        await createRideReview({
          bookingId: booking?._id,
          overallRating,
          cleanlinessRating,
          punctualityRating,
          behaviorRating,
          reviewText,
        });
      }

      onSubmitted?.();
      onClose?.();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to save review"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const title =
    mode === "create"
      ? "Rate Your Ride"
      : mode === "edit"
      ? "Update Your Review"
      : "Review Details";

  const buttonLabel =
    mode === "create"
      ? "Submit Review"
      : mode === "edit"
      ? "Update Review"
      : "Close";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 px-4 py-6">
      <div className="w-full max-w-3xl rounded-[24px] border border-zinc-800 bg-[#0c0c0f] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="w-full text-center">
            <h2 className="text-3xl font-black text-white">{title}</h2>
            <p className="mt-2 text-lg text-zinc-400">
              How was your trip with {driverName}?
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="text-center">
            <p className="text-lg font-black uppercase tracking-wide text-zinc-400">
              Overall Experience
            </p>

            <div className="mt-4 flex justify-center">
              <StarRating
                value={overallRating}
                onChange={setOverallRating}
                size={38}
                disabled={isViewOnly}
              />
            </div>
          </div>

          <div className="my-6 border-t border-zinc-800" />

          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xl font-semibold text-white">Cleanliness</span>
              <StarRating
                value={cleanlinessRating}
                onChange={setCleanlinessRating}
                disabled={isViewOnly}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-xl font-semibold text-white">Punctuality</span>
              <StarRating
                value={punctualityRating}
                onChange={setPunctualityRating}
                disabled={isViewOnly}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-xl font-semibold text-white">Behavior</span>
              <StarRating
                value={behaviorRating}
                onChange={setBehaviorRating}
                disabled={isViewOnly}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-3 block text-xl font-semibold text-white">
              Write a review (optional)
            </label>

            <textarea
              rows={4}
              value={reviewText}
              disabled={isViewOnly}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share details of your experience..."
              className="w-full resize-none rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-white placeholder:text-zinc-500 outline-none transition focus:border-[#B8860B] disabled:opacity-80"
            />
          </div>

          {reviewData?.reviewDeadlineAt ? (
            <div className="mt-4 text-sm text-zinc-400">
              Edit deadline: {new Date(reviewData.reviewDeadlineAt).toLocaleString()}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-2xl bg-[#B8860B] px-6 py-4 text-lg font-black text-black transition hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? "Saving..." : buttonLabel}
          </button>
        </form>
      </div>
    </div>
  );
}