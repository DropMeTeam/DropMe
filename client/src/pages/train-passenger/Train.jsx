import { Link } from "react-router-dom";
import {
  ArrowRight,
  Search,
  Ticket,
  TrainFront,
  Mountain,
  Sofa,
  Bell,
  Smartphone,
} from "lucide-react";

import heroBg from "../../assets/train-home/hero-background.png";
import searchCardImg from "../../assets/train-home/search-trains.png";
import bookingsCardImg from "../../assets/train-home/my-bookings.png";
import scenicMainImg from "../../assets/train-home/scenic-main.png";
import galleryTrackImg from "../../assets/train-home/gallery-track.png";
import galleryLuxuryImg from "../../assets/train-home/gallery-luxury.png";
import galleryFrontImg from "../../assets/train-home/gallery-front.png";
import comfortImg from "../../assets/train-home/why-comfort.png";
import panoramicImg from "../../assets/train-home/why-panoramic.png";
import bookingImg from "../../assets/train-home/why-booking.png";
import updatesImg from "../../assets/train-home/why-updates.png";

const quickActions = [
  {
    title: "Search Trains",
    subtitle: "Plan Your Journey",
    to: "/train-service",
    cta: "Book Now",
    image: searchCardImg,
    icon: Search,
  },
  {
    title: "My Bookings",
    subtitle: "View Your Trips",
    to: "/train-service/bookings",
    cta: "View All",
    image: bookingsCardImg,
    icon: Ticket,
  },
];

const whyCards = [
  {
    title: "Luxury Comfort",
    text: "Spacious seating, relaxed travel, and a smoother long-distance journey.",
    image: comfortImg,
    icon: Sofa,
  },
  {
    title: "Panoramic Views",
    text: "Enjoy scenic landscapes, open countryside, and memorable route views.",
    image: panoramicImg,
    icon: Mountain,
  },
  {
    title: "Simple Booking",
    text: "Search routes, choose your journey, and manage bookings in one flow.",
    image: bookingImg,
    icon: Smartphone,
  },
  {
    title: "Live Updates",
    text: "Stay aligned with booking access, journey details, and schedule visibility.",
    image: updatesImg,
    icon: Bell,
  },
];

function QuickActionCard({ item }) {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1320] shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/20 hover:shadow-[0_28px_80px_rgba(34,211,238,0.12)]"
    >
      <img
        src={item.image}
        alt={item.title}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.2)_0%,rgba(2,6,23,0.28)_34%,rgba(2,6,23,0.7)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.12),transparent_24%),radial-gradient(circle_at_85%_20%,rgba(34,211,238,0.10),transparent_22%)]" />

      <div className="relative flex min-h-[260px] flex-col justify-between p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-[78%] rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.24)_0%,rgba(15,23,42,0.34)_100%)] p-5 backdrop-blur-[2px]">
            <h3 className="text-[1.9rem] font-bold leading-tight text-white">
              {item.title}
            </h3>
            <p className="mt-3 text-[1.2rem] text-white/90">{item.subtitle}</p>
          </div>

          <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/20 bg-white/[0.08] text-cyan-100 backdrop-blur-[2px]">
            <Icon className="h-6 w-6" />
          </div>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-[#10233a]/80 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-200 transition group-hover:border-cyan-200/35 group-hover:bg-[#143252]">
          <span>{item.cta}</span>
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

function WhyCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82)_0%,rgba(15,23,42,0.62)_100%)] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
      <div className="overflow-hidden rounded-[16px]">
        <img
          src={item.image}
          alt={item.title}
          className="h-36 w-full object-cover"
        />
      </div>

      <div className="mt-4 flex items-start gap-3">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/68">{item.text}</p>
        </div>
      </div>
    </div>
  );
}

export default function Train() {
  return (
    <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#050912] text-white">
      <div className="pointer-events-none absolute left-[-140px] top-[-80px] h-[320px] w-[320px] rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-120px] top-[140px] h-[320px] w-[320px] rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[140px] left-[20%] h-[260px] w-[260px] rounded-full bg-indigo-500/10 blur-3xl" />

      <section className="relative isolate min-h-[760px] overflow-hidden">
        <img
          src={heroBg}
          alt="Train hero"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,9,18,0.72)_0%,rgba(5,9,18,0.45)_20%,rgba(5,9,18,0.88)_75%,#050912_100%)]" />

        <div className="relative mx-auto flex max-w-[1440px] flex-col px-6 pb-20 pt-20 md:px-10 xl:px-14">
          <div className="mx-auto max-w-[860px] text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/90">
              <TrainFront className="h-4 w-4" />
              <span>Train Travel</span>
            </div>

            <h1 className="mt-8 text-5xl font-bold leading-[1.02] tracking-[-0.04em] text-white sm:text-6xl xl:text-7xl">
              Find your <span className="text-cyan-300 italic font-medium">perfect</span>
              <br />
              train journey
            </h1>

            <p className="mx-auto mt-6 max-w-[760px] text-lg leading-8 text-white/70 sm:text-xl">
              Experience the romance of rail travel with modern comfort. Book
              seamless routes across stunning landscapes with a cleaner,
              passenger-focused journey flow.
            </p>
          </div>

          <div className="mt-12">
            <div className="mx-auto max-w-[1280px]">
              <p className="mb-5 text-base font-medium text-white/88">Quick Actions</p>

              <div className="grid gap-6 lg:grid-cols-2">
                {quickActions.map((item) => (
                  <QuickActionCard key={item.title} item={item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-[linear-gradient(180deg,#07101e_0%,#07111f_100%)] py-20">
        <div className="mx-auto max-w-[1360px] px-6 md:px-10 xl:px-14">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
              Scenic Travel Inspiration
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
              Experience breathtaking journeys
            </h2>
          </div>

          <div className="mt-10 overflow-hidden rounded-[32px] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
            <img
              src={scenicMainImg}
              alt="Scenic train travel"
              className="h-[320px] w-full object-cover md:h-[500px] xl:h-[620px]"
            />
          </div>
        </div>
      </section>

      <section className="relative bg-[#08111f] py-20">
        <div className="mx-auto max-w-[1360px] px-6 md:px-10 xl:px-14">
          <div className="text-center">
            <h2 className="text-4xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
              Travel in Comfort & Style
            </h2>
            <p className="mx-auto mt-4 max-w-[760px] text-lg leading-8 text-white/65">
              Experience the beauty of rail travel with stunning views and
              premium comfort throughout the journey.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[galleryTrackImg, galleryLuxuryImg, galleryFrontImg].map((img, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] shadow-[0_18px_50px_rgba(0,0,0,0.20)]"
              >
                <img
                  src={img}
                  alt={`Train gallery ${index + 1}`}
                  className="h-[340px] w-full object-cover"
                />
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <div className="rounded-full border border-cyan-300/15 bg-cyan-400/8 px-6 py-3 text-sm font-medium text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.08)]">
              10,000+ happy passengers travel with us every day
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-[linear-gradient(180deg,#060b14_0%,#050912_100%)] py-24">
        <div className="mx-auto max-w-[1360px] px-6 md:px-10 xl:px-14">
          <div className="text-center">
            <h2 className="text-4xl font-bold uppercase tracking-[-0.03em] text-white sm:text-5xl">
              Why Travel by Train
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {whyCards.map((item) => (
              <WhyCard key={item.title} item={item} />
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <Link
              to="/train-service"
              className="inline-flex items-center gap-3 rounded-full border border-cyan-300/25 bg-[#10233a] px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-200 shadow-[0_0_22px_rgba(34,211,238,0.14)] transition hover:border-cyan-200/40 hover:bg-[#143252]"
            >
              <span>Start Your Adventure With DropMe</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}