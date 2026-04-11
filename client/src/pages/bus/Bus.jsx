import { Link } from "react-router-dom";
import {
  Search,
  Ticket,
  ArrowRight,
  ShieldCheck,
  MapPinned,
  Clock3,
  Sparkles,
  Star,
  History,
  PhoneCall,
  Camera,
  Armchair,
} from "lucide-react";
import busBg from "../../assets/bus-landing/Bus.png";
import seatsImg from "../../assets/bus-landing/seats.png";
import busRoadImg from "../../assets/bus-landing/bus2.png";

export default function Bus() {
  const featureCards = [
    {
      icon: Search,
      title: "Smart route search",
      text: "Find buses across all operators instantly, filtered by price, timing or seat type.",
      iconWrap: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    },
    {
      icon: Ticket,
      title: "Instant digital tickets",
      text: "Your ticket lands in seconds — no printing, no queues, just show and board.",
      iconWrap: "border-violet-400/20 bg-violet-400/10 text-violet-300",
    },
    {
      icon: ShieldCheck,
      title: "Safe and secure",
      text: "All payments encrypted with verified operators only on our platform.",
      iconWrap: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    },
    {
      icon: Star,
      title: "Trusted operators",
      text: "Real passenger ratings on every bus and route so you book with confidence.",
      iconWrap: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    },
    {
      icon: History,
      title: "Ticket history",
      text: "Every trip stored and organized in your account — accessible anytime.",
      iconWrap: "border-rose-400/20 bg-rose-400/10 text-rose-300",
    },
    {
      icon: PhoneCall,
      title: "24/7 support",
      text: "Live help whenever you need it — before, during, or after your trip.",
      iconWrap: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    },
    {
      icon: Camera,
      title: "CCTV monitoring",
      text: "Live onboard surveillance adds an extra layer of safety for a more secure journey.",
      iconWrap: "border-red-400/20 bg-red-400/10 text-red-300",
    },
    {
      icon: Armchair,
      title: "Premium seat comfort",
      text: "Enjoy spacious seating, cleaner interiors, and a more relaxing ride on every trip.",
      iconWrap: "border-indigo-400/20 bg-indigo-400/10 text-indigo-300",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <section className="overflow-visible rounded-[30px] border border-white/10 bg-[#08101d] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="relative h-[430px] overflow-hidden rounded-[30px] sm:h-[500px] lg:h-[560px]">
            <img
              src={busBg}
              alt="Premium bus"
              className="h-full w-full object-cover object-center"
            />

            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,20,0.14)_0%,rgba(5,10,20,0.24)_28%,rgba(5,10,20,0.42)_60%,rgba(5,10,20,0.68)_100%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />

            <div className="absolute inset-0 flex flex-col items-center justify-start px-6 pt-7 text-center sm:px-8 sm:pt-10 lg:px-10 lg:pt-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-[#243746]/50 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                Premium Bus Experience
              </div>

              <h1 className="mt-6 max-w-[1200px] text-[2.55rem] font-extrabold leading-[0.98] tracking-tight text-white sm:text-[3.5rem] lg:text-[4.7rem]">
                <span className="block whitespace-nowrap">
                  Travel in{" "}
                  <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                    Ultimate Comfort.
                  </span>
                </span>
                <span className="block whitespace-nowrap">
                  Redefining the Bus Journey.
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-5xl text-sm leading-8 text-white/80 sm:text-base lg:text-[1.05rem]">
                Instant booking. Ultimate relaxation. Experience the gold standard of
                ground travel with our premium intercity bus service across Sri Lanka.
              </p>
            </div>
          </div>

          <div className="relative z-10 -mt-20 px-5 pb-6 sm:-mt-24 sm:px-8 sm:pb-8 lg:-mt-28 lg:px-10 lg:pb-10">
            <div className="grid gap-5 lg:grid-cols-2">
              <Link
                to="/buses/search"
                className="group relative flex min-h-[390px] flex-col overflow-hidden rounded-[26px] border border-blue-300/10 bg-[linear-gradient(135deg,rgba(13,22,40,0.90),rgba(10,18,34,0.84))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.32)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:shadow-[0_24px_70px_rgba(34,211,238,0.12)] sm:p-6"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/8 via-transparent to-blue-500/10 opacity-80" />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
                      <Search className="h-6 w-6" />
                    </div>

                    <div className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white/70 transition duration-300 group-hover:translate-x-1 group-hover:text-cyan-200">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>

                  <h2 className="mt-6 text-2xl font-bold tracking-tight text-white sm:text-[1.8rem]">
                    Search Buses
                  </h2>

                  <p className="mt-3 max-w-md text-sm leading-7 text-white/68 sm:text-[15px]">
                    Find routes from Colombo to Galle, Kandy, Jaffna and more.
                    Filter by premium classes and choose the right trip with a
                    smoother booking flow.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-white/70">
                      <MapPinned className="h-3.5 w-3.5" />
                      Route discovery
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-white/70">
                      <Clock3 className="h-3.5 w-3.5" />
                      Fast booking
                    </span>
                  </div>

                  <div className="mt-auto pt-7">
                    <div className="flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#223a68] to-[#1b2f57] px-5 text-sm font-semibold text-white transition duration-300 group-hover:from-[#2a487f] group-hover:to-[#223d72]">
                      Book New Trip
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>

              <Link
                to="/buses/tickets"
                className="group relative flex min-h-[390px] flex-col overflow-hidden rounded-[26px] border border-blue-300/10 bg-[linear-gradient(135deg,rgba(13,22,40,0.90),rgba(10,18,34,0.84))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.32)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-blue-300/30 hover:shadow-[0_24px_70px_rgba(59,130,246,0.14)] sm:p-6"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-400/6 opacity-80" />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-300/15 bg-blue-300/10 text-blue-200">
                      <Ticket className="h-6 w-6" />
                    </div>

                    <div className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white/70 transition duration-300 group-hover:translate-x-1 group-hover:text-blue-200">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>

                  <h2 className="mt-6 text-2xl font-bold tracking-tight text-white sm:text-[1.8rem]">
                    My Bus Tickets
                  </h2>

                  <p className="mt-3 max-w-md text-sm leading-7 text-white/68 sm:text-[15px]">
                    Access your active boarding passes, review reservations, and
                    keep every confirmed journey organized in one professional dashboard.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-white/70">
                      <Ticket className="h-3.5 w-3.5" />
                      Ticket control
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-white/70">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Secure access
                    </span>
                  </div>

                  <div className="mt-auto pt-7">
                    <div className="flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#223a68] to-[#1b2f57] px-5 text-sm font-semibold text-white transition duration-300 group-hover:from-[#2a487f] group-hover:to-[#223d72]">
                      Manage Bookings
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#08101d] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <div className="relative h-[320px] sm:h-[400px] lg:h-[520px]">
              <img
                src={seatsImg}
                alt="Premium bus seats"
                className="h-full w-full object-cover object-center"
              />

              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,10,20,0.82)_0%,rgba(5,10,20,0.55)_40%,rgba(5,10,20,0.30)_65%,rgba(5,10,20,0.45)_100%)]" />

              <div className="absolute inset-0 flex items-end lg:items-center">
                <div className="w-full px-6 pb-8 sm:px-8 sm:pb-10 lg:max-w-2xl lg:px-12 lg:pb-0">
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
                    Why BusWay
                  </div>

                  <h2 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                    Everything you need
                  </h2>

                  <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                    Built for passengers who want speed, clarity, comfort, and a smoother
                    booking experience from search to boarding.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[30px] border border-white/10 bg-[#050b18] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] sm:p-6 lg:p-8">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {featureCards.map(({ icon: Icon, title, text, iconWrap }) => (
                <div
                  key={title}
                  className="group rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,16,30,0.96),rgba(6,12,24,0.98))] p-7 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/20 hover:shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${iconWrap}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="mt-7 text-[1.45rem] font-bold leading-tight text-white">
                    {title}
                  </h3>

                  <p className="mt-4 text-[0.98rem] leading-8 text-white/65">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#08101d] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <div className="relative h-[320px] sm:h-[360px] lg:h-[420px]">
              <img
                src={busRoadImg}
                alt="Luxury bus on the road"
                className="h-full w-full object-cover object-center"
              />

              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,10,20,0.92)_0%,rgba(5,10,20,0.84)_20%,rgba(5,10,20,0.62)_42%,rgba(5,10,20,0.34)_68%,rgba(5,10,20,0.18)_100%)]" />

              <div className="absolute inset-0 flex items-center">
                <div className="max-w-2xl px-6 sm:px-8 lg:px-10">
                <h2 className="text-3xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-4xl lg:text-[3rem]">
                  <span className="block">Ready for a</span>
                  <span className="block">
                    <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                      different
                    </span>
                  </span>
                  <span className="block">perspective?</span>
                </h2>

                  <p className="mt-5 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                    Join the community of travelers who choose elegance over the ordinary.
                    Your next premium bus journey is just a tap away.
                  </p>

                  <div className="mt-7">
                    <Link
                      to="/buses/search"
                      className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-6 text-sm font-semibold text-slate-900 transition duration-300 hover:bg-cyan-100"
                    >
                      Book Your Seat Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}