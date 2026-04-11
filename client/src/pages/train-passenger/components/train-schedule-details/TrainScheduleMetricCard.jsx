export default function TrainScheduleMetricCard({
  icon: Icon,
  label,
  value,
  accentClass = "text-blue-400",
  children,
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/8 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/6 ring-1 ring-white/8">
          <Icon className={`h-6 w-6 ${accentClass}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm text-white/55">{label}</div>

          {children ? (
            <div className="mt-2">{children}</div>
          ) : (
            <div className="mt-1 truncate text-2xl font-semibold text-white">{value}</div>
          )}
        </div>
      </div>
    </div>
  );
}
