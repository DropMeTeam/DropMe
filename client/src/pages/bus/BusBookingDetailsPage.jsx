import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BusFront,
  CalendarDays,
  MapPin,
  Ticket,
  Users,
  LayoutGrid,
} from "lucide-react";
import { api } from "../../lib/api";

function shortLabel(label = "") {
  return String(label).split(",")[0].trim();
}

function buildAbsoluteImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;

  const baseUrl = api?.defaults?.baseURL || "http://localhost:5000";
  const cleanBase = String(baseUrl).replace(/\/$/, "");

  return `${cleanBase}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function BusBookingDetailsPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const bus = state?.bus || null;
  const route = state?.route || null;
  const schedule = state?.schedule || null;
  const searchData = state?.searchData || null;

  if (!bus || !route || !searchData) {
    return (
      <div className="min-h-screen bg-[#060812] px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <h1 className="text-2xl font-semibold">Booking details unavailable</h1>
          <p className="mt-2 text-white/60">
            Open this page by selecting a bus from the bus booking flow.
          </p>

          <button
            onClick={() => navigate("/bus-booking")}
            className="mt-6 rounded-xl bg-white px-5 py-3 font-medium text-black"
          >
            Back to Bus Booking
          </button>
        </div>
      </div>
    );
  }

  const photoUrl = buildAbsoluteImageUrl(bus.photoUrl);

  return (
    <div className="min-h-screen bg-[#060812] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="aspect-[16/10] w-full bg-black/20">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={bus.plateNumber || "Bus"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-white/35">
                  <BusFront className="h-14 w-14" />
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="text-xs uppercase tracking-[0.28em] text-white/35">
                Bus No
              </div>
              <div className="mt-1 text-3xl font-semibold text-white">
                {bus.plateNumber || "-"}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/75">
                  {bus.busType || "-"}
                </span>

                {(bus.features || []).map((feature, index) => (
                  <span
                    key={`${feature}-${index}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/75"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h1 className="text-2xl font-semibold">Booking Details</h1>
            <p className="mt-1 text-white/60">
              Temporary details view until ticket pricing and seat arrangement are implemented.
            </p>

            <div className="mt-6 space-y-4">
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Route"
                value={`${shortLabel(route?.start?.label)} -> ${shortLabel(route?.end?.label)}`}
              />

              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Travel date"
                value={searchData?.date || "-"}
              />

              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Passenger journey"
                value={`${shortLabel(searchData?.from?.label)} -> ${shortLabel(searchData?.to?.label)}`}
              />

              <InfoRow
                icon={<Users className="h-4 w-4" />}
                label="Available seats"
                value={`${bus?.seatsTotal || 0} (temporary)`}
              />

              <InfoRow
                icon={<Ticket className="h-4 w-4" />}
                label="Ticket price"
                value="Not set yet"
              />

              <InfoRow
                icon={<LayoutGrid className="h-4 w-4" />}
                label="Seat arrangement"
                value="Not implemented yet"
              />

              <InfoRow
                icon={<BusFront className="h-4 w-4" />}
                label="Direction"
                value={route?.travelDirection === "B_TO_A" ? "Reverse" : "Forward"}
              />

              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Schedule stops"
                value={`${schedule?.stopTimes?.length || 0} stops`}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-white/60">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-right text-sm font-semibold text-white">{value}</div>
    </div>
  );
}