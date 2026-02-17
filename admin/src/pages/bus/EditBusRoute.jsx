import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";
import PlaceSearch from "../../components/PlaceSearch";
import api from "../../lib/api";

export default function EditBusRoute() {
  const { id } = useParams();
  const nav = useNavigate();

  const [routeNumber, setRouteNumber] = useState("");
  const [routeType, setRouteType] = useState("NORMAL");
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [stops, setStops] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/bus/routes/${id}`);
        const r = res.data?.route;
        if (!alive) return;

        setRouteNumber(r.routeNumber || "");
        setRouteType(r.routeType || "NORMAL");
        setStart(r.start || null);
        setEnd(r.end || null);
        // normalize stops order
        const ss = (r.stops || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
        setStops(ss);
      } catch (e) {
        setMsg({ type: "error", text: e?.response?.data?.message || e.message || "Failed to load route" });
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [id]);

  const center = useMemo(() => {
    if (start) return [start.lat, start.lng];
    return [7.8731, 80.7718];
  }, [start]);

  const polyline = useMemo(() => {
    const pts = [];
    if (start) pts.push([start.lat, start.lng]);
    for (const s of stops) pts.push([s.lat, s.lng]);
    if (end) pts.push([end.lat, end.lng]);
    return pts;
  }, [start, stops, end]);

  function removeStop(index) {
    setStops(prev => prev.filter((_, i) => i !== index));
  }
  function moveStop(index, dir) {
    setStops(prev => {
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

    if (!routeNumber.trim()) return setMsg({ type: "error", text: "Route number is required" });
    if (!start) return setMsg({ type: "error", text: "Start is required" });
    if (!end) return setMsg({ type: "error", text: "End is required" });

    const cap = routeType === "EXPRESS" ? 10 : 50;
    if (stops.length > cap) return setMsg({ type: "error", text: `${routeType} cannot exceed ${cap} stops` });

    setSaving(true);
    try {
      const payload = {
        routeNumber,
        routeType,
        start,
        end,
        stops: stops.map((s) => ({ label: s.label, lat: s.lat, lng: s.lng }))
      };
      const res = await api.patch(`/bus/routes/${id}`, payload);
      if (res.data?.ok) setMsg({ type: "success", text: "Route updated" });
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || e.message || "Update failed" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>View / Edit Route</h2>
        <button onClick={() => nav("/bus/routes")}>Back</button>
      </div>

      <form onSubmit={onSave} style={{ display: "grid", gap: 12, maxWidth: 900 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Route Number</label>
          <input value={routeNumber} onChange={(e) => setRouteNumber(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Route Type</label>
          <select value={routeType} onChange={(e) => setRouteType(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}>
            <option value="NORMAL">NORMAL</option>
            <option value="EXPRESS">EXPRESS</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <PlaceSearch label="Update Start" onSelect={setStart} />
            {start && <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>Start: <b>{start.label}</b></div>}
          </div>
          <div>
            <PlaceSearch label="Update End" onSelect={setEnd} />
            {end && <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>End: <b>{end.label}</b></div>}
          </div>
        </div>

        <div>
          <PlaceSearch label="Add Stop" onSelect={(p) => setStops(prev => [...prev, p])} />
          {stops.length > 0 && (
            <div style={{ marginTop: 10, border: "1px solid #eee", borderRadius: 12, padding: 10 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Stops ({stops.length})</div>
              {stops.map((s, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0" }}>
                  <div style={{ width: 26, fontWeight: 700 }}>{idx + 1}.</div>
                  <div style={{ flex: 1 }}>{s.label}</div>
                  <button type="button" onClick={() => moveStop(idx, -1)} disabled={idx === 0}>↑</button>
                  <button type="button" onClick={() => moveStop(idx, +1)} disabled={idx === stops.length - 1}>↓</button>
                  <button type="button" onClick={() => removeStop(idx)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {msg && (
          <div style={{ padding: 10, borderRadius: 10, border: "1px solid", borderColor: msg.type === "success" ? "#c7f2d0" : "#ffd1d1", background: msg.type === "success" ? "#f2fff5" : "#fff5f5" }}>
            {msg.text}
          </div>
        )}

        <button type="submit" disabled={saving} style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd", cursor: "pointer" }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <div style={{ height: 420, borderRadius: 16, overflow: "hidden", border: "1px solid #eee" }}>
        <MapContainer center={center} zoom={start ? 12 : 8} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {start && <Marker position={[start.lat, start.lng]}><Tooltip permanent>START</Tooltip></Marker>}
          {stops.map((s, idx) => <Marker key={idx} position={[s.lat, s.lng]}><Tooltip permanent>{idx + 1}</Tooltip></Marker>)}
          {end && <Marker position={[end.lat, end.lng]}><Tooltip permanent>END</Tooltip></Marker>}
          {polyline.length >= 2 && <Polyline positions={polyline} />}
        </MapContainer>
      </div>
    </div>
  );
}
