const toneClasses = {
  loading: {
    wrapper: "border-blue-400/20 bg-blue-500/10 text-blue-50",
    badge: "bg-blue-500/15 text-blue-100 border-blue-400/20",
  },
  error: {
    wrapper: "border-red-400/20 bg-red-500/10 text-red-50",
    badge: "bg-red-500/15 text-red-100 border-red-400/20",
  },
  empty: {
    wrapper: "border-white/10 bg-white/5 text-white",
    badge: "bg-white/10 text-white/80 border-white/10",
  },
};

export default function TrainScheduleStateCard({ tone = "empty", title, message }) {
  const styles = toneClasses[tone] || toneClasses.empty;

  return (
    <div className={`rounded-[28px] border p-6 shadow-[0_14px_50px_rgba(2,8,23,0.35)] ${styles.wrapper}`}>
      <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${styles.badge}`}>
        Train schedule
      </div>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-current/80">{message}</p>
    </div>
  );
}
