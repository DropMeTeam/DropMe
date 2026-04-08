export default function BookingsSectionHeader({ title, subtitle }) {
  return (
    <div className="border-b border-white/8 pb-4">
      <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
    </div>
  );
}
