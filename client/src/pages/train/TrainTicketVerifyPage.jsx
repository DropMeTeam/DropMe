import { useState } from "react";
import { TicketCheck, Loader2 } from "lucide-react";
import { verifyTrainTicketCode } from "../../lib/trainAdminApi";

const STATUS_BADGE = {
  valid: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  unpaid: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  cancelled: "border-red-400/30 bg-red-500/15 text-red-100",
  not_found: "border-zinc-500/40 bg-zinc-800/60 text-zinc-300",
};

function formatLkr(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `LKR ${v.toFixed(2)}`;
}

export default function TrainTicketVerifyPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function runVerify() {
    if (loading) return;

    const trimmed = code.trim();
    setError("");
    setResult(null);

    if (!trimmed) {
      setError("Enter or paste a ticket number, booking id, or QR payload.");
      return;
    }

    setLoading(true);
    try {
      const data = await verifyTrainTicketCode(trimmed);
      setResult(data);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Verification request failed"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    runVerify();
  }

  const booking = result?.booking;
  const status = result?.verificationStatus;

  return (
    <div className="mx-auto max-w-3xl space-y-6 text-white">
      <div>
        <div className="flex items-center gap-2">
          <TicketCheck className="h-6 w-6 text-blue-300" />
          <h1 className="text-2xl font-semibold tracking-tight">Ticket Verification</h1>
        </div>
        <p className="mt-2 text-sm text-white/55">
          Paste a ticket number (e.g. TRN-…), booking id, or raw QR text. Use when no camera
          scanner is available.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(21,30,43,0.96)_0%,rgba(11,17,27,0.96)_100%)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.32)]"
      >
        <label className="block text-sm font-medium text-white/80">
          Paste ticket code / QR payload
        </label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              runVerify();
            }
          }}
          rows={3}
          disabled={loading}
          placeholder="TRN-… or booking id"
          className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-[#09101b] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/45"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(37,99,235,0.35)] transition hover:bg-blue-500 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </>
          ) : (
            <>
              <TicketCheck className="h-4 w-4" />
              Verify
            </>
          )}
        </button>
      </form>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <h2 className="text-lg font-semibold">Result</h2>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_BADGE[status] || STATUS_BADGE.not_found}`}
            >
              {status === "not_found" ? "Not found" : status}
            </span>
          </div>

          {result.message && status === "not_found" ? (
            <p className="mt-4 text-sm text-white/60">{result.message}</p>
          ) : null}

          {booking ? (
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/40">Passenger</dt>
                <dd className="mt-0.5 font-medium text-white">{booking.passengerName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/40">Email</dt>
                <dd className="mt-0.5 text-white/90">{booking.passengerEmail || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/40">Ticket number</dt>
                <dd className="mt-0.5 font-mono text-white">{booking.ticketNumber || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/40">Booking id</dt>
                <dd className="mt-0.5 font-mono text-xs text-white/80">{booking.id}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/40">Train</dt>
                <dd className="mt-0.5 text-white">
                  {booking.trainNo || "—"}
                  {booking.trainName ? (
                    <span className="text-white/60"> — {booking.trainName}</span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/40">Route</dt>
                <dd className="mt-0.5 text-white">
                  {booking.boardingStation || "—"} → {booking.destinationStation || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/40">Travel date</dt>
                <dd className="mt-0.5 text-white">{booking.travelDate || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/40">Travel day</dt>
                <dd className="mt-0.5 text-white">{booking.travelDay || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/40">Seats</dt>
                <dd className="mt-0.5 text-white">{booking.seats ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/40">Total fare</dt>
                <dd className="mt-0.5 font-medium text-white">{formatLkr(booking.totalFareLkr)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/40">Payment status</dt>
                <dd className="mt-0.5 text-white">{booking.paymentStatus || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/40">Booking status</dt>
                <dd className="mt-0.5 text-white">{booking.bookingStatus || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-white/40">Ticket email sent</dt>
                <dd className="mt-0.5 text-white/80">
                  {booking.ticketEmailSentAt ? booking.ticketEmailSentAt : "Not sent"}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
