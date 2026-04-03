function getClasses(status) {
  const value = String(status || "").toLowerCase();

  if (["paid", "booked", "confirmed"].includes(value)) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (["pending", "pending_payment", "unpaid"].includes(value)) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }

  if (["cancelled", "failed", "rejected"].includes(value)) {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }

  return "border-zinc-700 bg-zinc-800/60 text-zinc-200";
}

export default function BookingStatusBadge({ label = "Status", status = "" }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getClasses(
        status
      )}`}
    >
      {label}: {status || "-"}
    </span>
  );
}