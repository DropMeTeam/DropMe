import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const STYLES = {
  success: {
    wrapper: "border-emerald-500/25 bg-[linear-gradient(90deg,rgba(6,78,59,0.55),rgba(5,46,22,0.38))] text-emerald-100",
    icon: CheckCircle2,
    iconClass: "text-emerald-300",
  },
  error: {
    wrapper: "border-red-500/25 bg-[linear-gradient(90deg,rgba(127,29,29,0.55),rgba(69,10,10,0.38))] text-red-100",
    icon: AlertCircle,
    iconClass: "text-red-300",
  },
  info: {
    wrapper: "border-blue-500/25 bg-[linear-gradient(90deg,rgba(30,58,138,0.55),rgba(15,23,42,0.45))] text-blue-100",
    icon: Loader2,
    iconClass: "text-blue-300 animate-spin",
  },
};

export default function BookingsStatusBanner({ variant = "success", title, message }) {
  const style = STYLES[variant] || STYLES.success;
  const Icon = style.icon;

  return (
    <section className={`rounded-[22px] border px-5 py-4 ${style.wrapper}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/20">
          <Icon className={`h-4 w-4 ${style.iconClass}`} />
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs text-inherit/80 md:text-sm">{message}</div>
        </div>
      </div>
    </section>
  );
}
