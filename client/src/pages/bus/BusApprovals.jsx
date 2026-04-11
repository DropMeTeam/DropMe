import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Bus,
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  MapPin,
  RefreshCcw,
  Snowflake,
  UserRound,
  Wifi,
  XCircle,
} from "lucide-react";
import { api } from "../../lib/api";

function shortPlace(label = "") {
  if (!label) return "-";

  if (label.includes(" - ")) {
    const right = label.split(" - ").pop()?.trim();
    if (right) return right;
  }

  return String(label).split(",")[0].trim();
}

function SummaryCard({ title, value, valueClassName = "text-amber-300" }) {
  return (
    <div className="w-full max-w-[280px] rounded-[22px] border border-white/10 bg-[#0e1520] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.28)]">
      <p className="text-[10px] uppercase tracking-[0.20em] text-zinc-500">
        {title}
      </p>

      <h3 className={`mt-3 text-4xl font-bold ${valueClassName}`}>{value}</h3>

      <p className="mt-2 text-xs leading-5 text-zinc-500">
        Waiting for admin review.
      </p>
    </div>
  );
}

export default function BusApprovals() {
  const nav = useNavigate();

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [notes, setNotes] = useState({});
  const [err, setErr] = useState("");

  const API_ORIGIN = useMemo(() => {
    const b = api?.defaults?.baseURL;
    if (typeof b === "string" && b.startsWith("http")) return b.replace(/\/$/, "");
    return import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";
  }, []);

  const absUrl = (u) => {
    if (!u) return "";
    if (u.startsWith("http")) return u;
    return `${API_ORIGIN}${u.startsWith("/") ? "" : "/"}${u}`;
  };

  async function loadPending() {
    setLoading(true);
    setErr("");

    try {
      const { data } = await api.get("/api/admin/bus-registrations/pending");
      const list = Array.isArray(data) ? data : data?.pending || [];
      setPending(list);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to load pending registrations"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
  }, []);

  function setNoteFor(id, value) {
    setNotes((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  function clearNoteFor(id) {
    setNotes((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  async function approve(id) {
    setBusyId(id);
    setErr("");

    try {
      await api.post(`/api/admin/bus-registrations/${id}/approve`, {
        note: notes[id] || "",
      });

      clearNoteFor(id);
      await loadPending();
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Approve failed"
      );
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id) {
    setBusyId(id);
    setErr("");

    try {
      await api.post(`/api/admin/bus-registrations/${id}/reject`, {
        note: notes[id] || "Rejected",
      });

      clearNoteFor(id);
      await loadPending();
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Reject failed"
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#06080d] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="rounded-[30px] border border-white/8 bg-[#090b10] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.35)] md:p-7">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
            <div className="flex min-w-0 items-start gap-3">
              <button
                type="button"
                onClick={() => nav("/bus")}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08]"
                title="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-400/15 bg-blue-400/10 text-blue-300">
                    <Bus className="h-6 w-6" />
                  </div>

                  <div className="min-w-0">
                    <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                      Bus Approvals
                    </h1>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                      Fleet Review & Onboarding Control
                    </p>
                  </div>
                </div>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
                  Review pending registrations, inspect submitted evidence,
                  validate route mapping, and approve or reject buses with
                  decision notes.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-4 xl:items-end">
              <button
                type="button"
                onClick={loadPending}
                disabled={loading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-60"
              >
                <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <SummaryCard title="Pending Registrations" value={pending.length} />
            </div>
          </div>

          {err ? (
            <div className="mt-6 rounded-[20px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white">
                Pending Bus Registrations
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Review each registration card and record a note before approval
                or rejection.
              </p>
            </div>

            {loading ? (
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-10 text-center text-zinc-400">
                Loading pending registrations...
              </div>
            ) : null}

            {!loading && pending.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-10 text-center text-zinc-500">
                No pending registrations right now.
              </div>
            ) : null}

            {!loading && pending.length > 0 ? (
              <div className="grid gap-6">
                {pending.map((b) => {
                  const route = b?.routeId || b?.route || null;

                  const startLabel = route?.start?.label || route?.start || "-";
                  const endLabel = route?.end?.label || route?.end || "-";

                  const routeLabel = route?.routeNumber
                    ? `${route.routeNumber} • ${shortPlace(startLabel)} → ${shortPlace(endLabel)}`
                    : `${shortPlace(startLabel)} → ${shortPlace(endLabel)}`;

                  const busPhoto = absUrl(b?.photoUrl);
                  const regPhoto = absUrl(
                    b?.registrationPhotoUrl || b?.registrationUrl
                  );
                  const permitPhoto = absUrl(
                    b?.permitPhotoUrl || b?.permitUrl
                  );

                  const isBusy = busyId === b._id;
                  const features = Array.isArray(b?.features)
                    ? b.features.filter(Boolean)
                    : [];

                  return (
                    <div
                      key={b._id}
                      className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0f141c] shadow-[0_14px_35px_rgba(0,0,0,0.3)]"
                    >
                      <div className="grid gap-6 p-5 xl:grid-cols-[300px_minmax(0,1fr)]">
                        <div className="space-y-4">
                          <PhotoHeroCard
                            title="Bus Preview"
                            url={busPhoto}
                            fallbackText="Bus photo not provided"
                            hero
                          />

                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                            <PhotoCard
                              title="Registration Photo"
                              url={regPhoto}
                              fallbackText="Not provided"
                            />
                            <PhotoCard
                              title="Permit Photo"
                              url={permitPhoto}
                              fallbackText="Not provided"
                            />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-col gap-4 border-b border-white/8 pb-5 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-3xl font-bold text-white">
                                  {b.plateNumber || "-"}
                                </h3>

                                <span className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300">
                                  {(b.status || "PENDING").toUpperCase()}
                                </span>
                              </div>

                              <p className="mt-2 text-sm text-zinc-400">
                                Registration is awaiting admin decision.
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <InfoTile
                              icon={<UserRound className="h-4 w-4" />}
                              label="Owner"
                              value={b?.owner?.name || "-"}
                              subValue={b?.owner?.email || "-"}
                            />

                            <InfoTile
                              icon={<Bus className="h-4 w-4" />}
                              label="Bus Details"
                              value={`${b?.busType || "-"} • ${b?.seatsTotal || 0} Seats`}
                              subValue={`Color: ${b?.color || "-"}`}
                            />

                            <InfoTile
                              icon={<MapPin className="h-4 w-4" />}
                              label="Route"
                              value={routeLabel}
                              subValue={route?.routeType || "Assigned route"}
                            />
                          </div>

                          <div className="mt-5 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300">
                              <BadgeCheck className="h-4 w-4 text-blue-300" />
                              Features
                            </div>

                            {features.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {features.map((feature, idx) => (
                                  <span
                                    key={`${feature}-${idx}`}
                                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200"
                                  >
                                    {feature.toLowerCase() === "wifi" ? (
                                      <Wifi className="h-3.5 w-3.5" />
                                    ) : null}
                                    {feature.toLowerCase() === "ac" ? (
                                      <Snowflake className="h-3.5 w-3.5" />
                                    ) : null}
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-zinc-500">
                                No features provided
                              </div>
                            )}
                          </div>

                          <div className="mt-5 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-300">
                              <FileText className="h-4 w-4 text-blue-300" />
                              Decision Controls
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                              <button
                                type="button"
                                onClick={() => approve(b._id)}
                                disabled={isBusy}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-60"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                {isBusy ? "Processing..." : "Approve"}
                              </button>

                              <button
                                type="button"
                                onClick={() => reject(b._id)}
                                disabled={isBusy}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 px-6 text-sm font-semibold text-red-200 transition hover:bg-red-400/15 disabled:opacity-60"
                              >
                                <XCircle className="h-4 w-4" />
                                {isBusy ? "Processing..." : "Reject"}
                              </button>
                            </div>

                            <div className="mt-4">
                              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                Decision Note
                              </label>

                              <textarea
                                rows={3}
                                value={notes[b._id] || ""}
                                onChange={(e) => setNoteFor(b._id, e.target.value)}
                                placeholder="Write approval or rejection note here..."
                                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-blue-400/40"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value, subValue }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
        <span className="text-zinc-400">{icon}</span>
        {label}
      </div>

      <div className="mt-3 break-words text-sm font-semibold leading-6 text-white">
        {value}
      </div>

      {subValue ? (
        <div className="mt-1 text-sm text-zinc-500">{subValue}</div>
      ) : null}
    </div>
  );
}

function PhotoHeroCard({ title, url, fallbackText, hero = false }) {
  if (!url) {
    return (
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
        <div className="flex h-[250px] w-full items-center justify-center text-zinc-500">
          {fallbackText}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
      <div className={`${hero ? "h-[250px]" : "h-40"} relative w-full overflow-hidden`}>
        <img
          src={url}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1017] via-[#0b1017]/15 to-transparent" />

        <div className="absolute bottom-3 left-3 right-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-sm">
            <div className="text-xs font-medium text-zinc-200">{title}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoCard({ title, url, fallbackText }) {
  if (!url) {
    return (
      <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <ImageIcon className="h-4 w-4 opacity-70" />
          {title}
        </div>
        <div className="mt-2 text-xs text-zinc-400">{fallbackText}</div>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <ImageIcon className="h-4 w-4 opacity-70" />
          {title}
        </div>

        <a
          className="inline-flex items-center gap-1 text-xs text-sky-300"
          href={url}
          target="_blank"
          rel="noreferrer"
          title="Open in new tab"
        >
          Open <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <img
        src={url}
        alt={title}
        className="mt-3 h-32 w-full rounded-xl border border-white/10 object-cover"
        loading="lazy"
      />
    </div>
  );
}