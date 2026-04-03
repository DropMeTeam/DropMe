import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bus, ArrowLeft, ExternalLink, Image as ImageIcon, MapPin, Wifi, Snowflake } from "lucide-react";
import { api } from "../../lib/api";

export default function BusApprovals() {
  const nav = useNavigate();

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [note, setNote] = useState("");
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
      const list = Array.isArray(data) ? data : (data?.pending || []);
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

  async function approve(id) {
    setBusyId(id);
    setErr("");
    try {
      await api.post(`/api/admin/bus-registrations/${id}/approve`, { note });
      setNote("");
      await loadPending();
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.error || "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id) {
    setBusyId(id);
    setErr("");
    try {
      await api.post(`/api/admin/bus-registrations/${id}/reject`, {
        note: note || "Rejected",
      });
      setNote("");
      await loadPending();
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.error || "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Bus Approvals</h1>
          </div>

          <button className="btn" onClick={() => nav("/bus")}>
            <ArrowLeft className="h-4 w-4" />
            <span className="ml-2">Back</span>
          </button>
        </div>

        <p className="mt-2 text-sm text-zinc-400">
          Fleet onboarding governance: review pending bus registrations and execute approve/reject decisions.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button className="btn" onClick={loadPending} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>

          <input
            className="input flex-1"
            placeholder="Decision note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {err ? <div className="mt-3 text-sm text-red-300">{err}</div> : null}
      </div>

      <div className="card mt-4 p-6">
        <h2 className="text-lg font-semibold">Pending Bus Registrations</h2>

        <div className="mt-4 grid gap-3">
          {pending.map((b) => {
            const route = b?.routeId || b?.route || null;

            const startLabel =
              route?.start?.label || route?.start || "-";

            const endLabel =
              route?.end?.label || route?.end || "-";

            const routeLabel =
              route?.routeNumber
                ? `${route.routeNumber} • ${startLabel} → ${endLabel}`
                : `${startLabel} → ${endLabel}`;

            const busPhoto = absUrl(b?.photoUrl);
            const regPhoto = absUrl(b?.registrationPhotoUrl || b?.registrationUrl);
            const permitPhoto = absUrl(b?.permitPhotoUrl || b?.permitUrl);

            const isBusy = busyId === b._id;
            const features = Array.isArray(b?.features) ? b.features.filter(Boolean) : [];

            return (
              <div key={b._id} className="rounded-xl border border-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{b.plateNumber}</div>
                  <div className="text-xs text-amber-300 border border-amber-400/30 rounded-full px-2 py-1">
                    {(b.status || "PENDING").toUpperCase()}
                  </div>
                </div>

                <div className="mt-2 text-sm text-zinc-400">
                  Owner: {b?.owner?.name || "-"} • {b?.owner?.email || "-"}
                </div>

                <div className="mt-1 text-sm text-zinc-400">
                  Type: {b.busType} • Seats: {b.seatsTotal} • Color: {b.color || "-"}
                </div>

                <div className="mt-2 flex items-center gap-2 text-sm text-zinc-300">
                  <MapPin className="h-4 w-4 opacity-70" />
                  <span className="opacity-80">Route:</span>
                  <span className="font-medium">{routeLabel}</span>
                </div>

                <div className="mt-2">
                  <div className="text-sm text-zinc-400">Features:</div>

                  {features.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
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
                    <div className="mt-1 text-sm text-zinc-500">No features provided</div>
                  )}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <PhotoCard
                    title="Bus Photo"
                    url={busPhoto}
                    fallbackText="Not provided"
                  />
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

                <div className="mt-4 flex gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => approve(b._id)}
                    disabled={isBusy}
                  >
                    {isBusy ? "Processing…" : "Approve"}
                  </button>
                  <button className="btn" onClick={() => reject(b._id)} disabled={isBusy}>
                    {isBusy ? "Processing…" : "Reject"}
                  </button>
                </div>
              </div>
            );
          })}

          {!loading && pending.length === 0 ? (
            <div className="text-sm text-zinc-400">No pending registrations right now.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PhotoCard({ title, url, fallbackText }) {
  if (!url) {
    return (
      <div className="rounded-xl border border-white/10 p-3 bg-white/5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ImageIcon className="h-4 w-4 opacity-70" />
          {title}
        </div>
        <div className="mt-2 text-xs text-zinc-400">{fallbackText}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 p-3 bg-white/5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ImageIcon className="h-4 w-4 opacity-70" />
          {title}
        </div>

        <a
          className="text-xs text-sky-300 inline-flex items-center gap-1"
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
        className="mt-2 h-28 w-full object-cover rounded-lg border border-white/10"
        loading="lazy"
      />
    </div>
  );
}