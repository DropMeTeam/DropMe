import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import api from "../../lib/api";
import PlaceSearch from "../../components/PlaceSearch";
import { getRoadRoute } from "../../lib/osrm";

// Fix default marker icons (Leaflet + Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

function normalizePlace(p) {
  if (!p) return null;
  // support {lon} legacy
  const lng = p.lng ?? p.lon;
  const lat = p.lat;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { ...p, lat, lng };
}

export default function EditBusRoute() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [routeNumber, setRouteNumber] = useState("");
  const [routeType, setRouteType] = useState("NORMAL");

  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [stops, setStops] = useState([]);

  // Road-following line (OSRM)
  const [roadLine, setRoadLine] = useState([]);

  const center = useMemo(() => {
    const s = normalizePlace(start);
    if (s) return [s.lat, s.lng];
    return [7.8731, 80.7718];
  }, [start]);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      // IMPORTANT: server route is /api/bus/routes/:id
      const res = await api.get(`/api/bus/routes/${id}`);
      const r = res.data?.route || res.data;

      setRouteNumber(r?.routeNumber || "");
      setRouteType(r?.routeType || "NORMAL");
      setStart(normalizePlace(r?.start));
      setEnd(normalizePlace(r?.end));
      setStops((r?.stops || []).map(normalizePlace).filter(Boolean));
    } catch (e) {
      setMsg({
        type: "error",
        text: e?.response?.data?.message || e.message || "Failed to load route"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Build road route whenever start/end/stops change
  useEffect(() => {
    let alive = true;

    async function buildRoad() {
      try {
        const s = normalizePlace(start);
        const e = normalizePlace(end);
        const mids = (stops || []).map(normalizePlace).filter(Boolean);

        if (!s || !e) {
          if (alive) setRoadLine([]);
          return;
        }

        const points = [s, ...mids, e];
        const result = await getRoadRoute(points);

        if (!alive) return;
        setRoadLine(result?.latlngs || []);
      } catch {
        // fallback: straight line if OSRM fails
        if (!alive) return;

        const s = normalizePlace(start);
        const e = normalizePlace(end);
        const mids = (stops || []).map(normalizePlace).filter(Boolean);

        const fallback = [];
        if (s) fallback.push([s.lat, s.lng]);
        for (const m of mids) fallback.push([m.lat, m.lng]);
        if (e) fallback.push([e.lat, e.lng]);

        setRoadLine(fallback);
      }
    }

    buildRoad();
    return () => {
      alive = false;
    };
  }, [start, end, stops]);

  function removeStop(index) {
    setStops((prev) => prev.filter((_, i) => i !== index));
  }

  function moveStop(index, dir) {
    setStops((prev) => {
      const copy = [...prev];
      const ni = index + dir;
      if (ni < 0 || ni >= copy.length) return prev;
      [copy[index], copy[ni]] = [copy[ni], copy[index]];
      return copy;
    });
  }

  async function onSave(e) {
    e.preventDefault();
    setMsg(null);

    const s = normalizePlace(start);
    const ept = normalizePlace(end);
    const mids = (stops || []).map(normalizePlace).filter(Boolean);

    if (!routeNumber.trim()) return setMsg({ type: "error", text: "Route number is required" });
    if (!s) return setMsg({ type: "error", text: "Start point is required" });
    if (!ept) return setMsg({ type: "error", text: "End point is required" });

    const cap = routeType === "EXPRESS" ? 10 : 50;
    if (mids.length > cap) {
      return setMsg({ type: "error", text: `${routeType} cannot exceed ${cap} stops` });
    }

    setSaving(true);
    try {
      const payload = {
        routeNumber: routeNumber.trim(),
        routeType,
        start: s,
        end: ept,
        stops: mids
      };

      await api.patch(`/api/bus/routes/${id}`, payload);
      setMsg({ type: "success", text: "Saved successfully" });
    } catch (e) {
      setMsg({
        type: "error",
        text: e?.response?.data?.message || e.message || "Save failed"
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 16 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>View / Edit Route</h2>
        <button onClick={() => nav("/bus/routes")} style={{ padding: 10, borderRadius: 10 }}>
          Back
        </button>
      </div>

      <form onSubmit={onSave} style={{ display: "grid", gap: 12, maxWidth: 900 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Route Number</label>
          <input
            value={routeNumber}
            onChange={(e) => setRouteNumber(e.target.value)}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Route Type</label>
          <select
            value={routeType}
            onChange={(e) => setRouteType(e.target.value)}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          >
            <option value="NORMAL">NORMAL</option>
            <option value="EXPRESS">EXPRESS</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <PlaceSearch label="Update Start" onSelect={(p) => setStart(p)} />
            {start && (
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                Start: <b>{start.label}</b>
              </div>
            )}
          </div>
          <div>
            <PlaceSearch label="Update End" onSelect={(p) => setEnd(p)} />
            {end && (
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                End: <b>{end.label}</b>
              </div>
            )}
          </div>
        </div>

        <div>
          <PlaceSearch label="Add Stop" onSelect={(p) => setStops((prev) => [...prev, p])} />

          {stops.length > 0 && (
            <div style={{ marginTop: 10, border: "1px solid #eee", borderRadius: 12, padding: 10 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Stops ({stops.length})</div>

              {stops.map((s, idx) => (
                <div
                  key={idx}
                  style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0" }}
                >
                  <div style={{ width: 26, fontWeight: 700 }}>{idx + 1}.</div>

                  <div style={{ flex: 1 }}>
                    <div>{s.label}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {Number(s.lat).toFixed(5)}, {Number(s.lng ?? s.lon).toFixed(5)}
                    </div>
                  </div>

                  <button type="button" onClick={() => moveStop(idx, -1)} disabled={idx === 0}>
                    ↑
                  </button>
                  <button type="button" onClick={() => moveStop(idx, +1)} disabled={idx === stops.length - 1}>
                    ↓
                  </button>
                  <button type="button" onClick={() => removeStop(idx)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {msg && (
          <div
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid",
              borderColor: msg.type === "success" ? "#c7f2d0" : "#ffd1d1",
              background: msg.type === "success" ? "#f2fff5" : "#fff5f5"
            }}
          >
            {msg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd", cursor: "pointer" }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <div style={{ height: 420, borderRadius: 16, overflow: "hidden", border: "1px solid #eee" }}>
        <MapContainer center={center} zoom={start ? 10 : 8} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {normalizePlace(start) && (
            <Marker position={[normalizePlace(start).lat, normalizePlace(start).lng]}>
              <Tooltip direction="top" offset={[0, -10]} permanent>
                START
              </Tooltip>
            </Marker>
          )}

          {(stops || []).map(normalizePlace).filter(Boolean).map((s, idx) => (
            <Marker key={idx} position={[s.lat, s.lng]}>
              <Tooltip direction="top" offset={[0, -10]} permanent>
                {idx + 1}
              </Tooltip>
            </Marker>
          ))}

          {normalizePlace(end) && (
            <Marker position={[normalizePlace(end).lat, normalizePlace(end).lng]}>
              <Tooltip direction="top" offset={[0, -10]} permanent>
                END
              </Tooltip>
            </Marker>
          )}

          {roadLine.length >= 2 && <Polyline positions={roadLine} />}
        </MapContainer>
      </div>
    </div>
  );
}
