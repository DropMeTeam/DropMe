export default function BookingsStatePanel({ message }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,20,26,0.96),rgba(10,12,18,0.96))] px-6 py-8 text-sm text-zinc-400 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
      {message}
    </div>
  );
}
