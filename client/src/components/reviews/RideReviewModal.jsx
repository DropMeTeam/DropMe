import { useMemo, useState } from "react";
import { Star, X } from "lucide-react";
import { createRideReview } from "../../services/reviewService";

function StarRating({ value, onChange, size = 28 }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={size}
              className={active ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}
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
  onSubmitted,
}) {
  const [overallRating, setOverallRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(4);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [behaviorRating, setBehaviorRating] = useState(4);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const driverName = useMemo(() => {
    return booking?.offerSnapshot?.driverName || "your driver";
  }, [booking]);

  if (!open || !booking) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!overallRating) {
      setError("Please select the overall rating");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const result = await createRideReview({
        bookingId: booking._id,
        overallRating,
        cleanlinessRating,
        punctualityRating,
        behaviorRating,
        reviewText,
      });

      onSubmitted?.(result?.review);
      onClose?.();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to submit review"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-2xl rounded-[28px] bg-white p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="w-full text-center">
            <h2 className="text-4xl font-extrabold text-slate-900">Rate Your Ride</h2>
            <p className="mt-2 text-2xl text-slate-500">
              How was your trip with {driverName}?
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="text-center">
            <p className="text-xl font-bold uppercase tracking-wide text-slate-400">
              Overall Experience
            </p>

            <div className="mt-5 flex justify-center">
              <StarRating value={overallRating} onChange={setOverallRating} size={40} />
            </div>
          </div>

          <div className="my-8 border-t border-slate-200" />

          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <span className="text-2xl font-semibold text-slate-800">Cleanliness</span>
              <StarRating value={cleanlinessRating} onChange={setCleanlinessRating} />
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-2xl font-semibold text-slate-800">Punctuality</span>
              <StarRating value={punctualityRating} onChange={setPunctualityRating} />
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-2xl font-semibold text-slate-800">Behavior</span>
              <StarRating value={behaviorRating} onChange={setBehaviorRating} />
            </div>
          </div>

          <div className="mt-8">
            <label className="mb-3 block text-2xl font-semibold text-slate-800">
              Write a review (optional)
            </label>

            <textarea
              rows={5}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share details of your experience..."
              className="w-full rounded-3xl border border-slate-300 px-5 py-4 text-xl text-slate-700 outline-none transition focus:border-blue-500"
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-base text-red-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 w-full rounded-2xl bg-blue-600 px-6 py-5 text-2xl font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}