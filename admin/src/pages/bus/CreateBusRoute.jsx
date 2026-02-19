import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import PlaceSearch from "../../components/PlaceSearch";
import { apiV1 } from "../../lib/api";
import { getRoadRoute } from "../../lib/osrm";

// Fix default marker icons (Leaflet + Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

export default function CreateBusRoute() {
  const [routeNumber, setRouteNumber] = useState("");
  const [routeType, setRouteType] = useState("NORMAL");

  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [stops, setStops] = useState([]);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // Road-following polyline from OSRM (fallback to straight line)
  const [roadLine, setRoadLine] = useState([]);

  const center = useMemo(() => {
    if (start) return [start.lat, start.lng];
    return [7.8731, 80.7718];
  }, [start]);

  useEffect(() => {
    let alive = true;

    async function buildRoad() {
      try {
        if (!start || !end) {
          if (alive) setRoadLine([]);
          return;
        }
        const points = [start, ...stops, end];
        const result = await getRoadRoute(points);
        if (!alive) return;
        setRoadLine(result?.latlngs || []);
      } catch {
        if (!alive) return;
        const fallback = [];
        if (start) fallback.push([start.lat, start.lng]);
        for (const s of stops) fallback.push([s.lat, s.lng]);
        if (end) fallback.push([end.lat, end.lng]);
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

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);

    if (!routeNumber.trim()) return setMsg({ type: "error", text: "Route number is required" });
    if (!start) return setMsg({ type: "error", text: "Start point is required" });
    if (!end) return setMsg({ type: "error", text: "End point is required" });

    const cap = routeType === "EXPRESS" ? 10 : 50;
    if (stops.length > cap) {
      return setMsg({ type: "error", text: `${routeType} cannot exceed ${cap} stops` });
    }

    setSaving(true);
    try {
      const payload = { routeNumber, routeType, start, end, stops };

      // apiV1 baseURL should be http://localhost:5000/api
      // so this hits POST http://localhost:5000/api/bus/routes
      const res = await apiV1.post("/bus/routes", payload);

      if (res.data?.ok) {
        setMsg({ type: "success", text: "Route created successfully" });
        setRouteNumber("");
        setRouteType("NORMAL");
        setStart(null);
        setEnd(null);
        setStops([]);
        setRoadLine([]);
      } else {
        setMsg({ type: "error", text: "Failed to create route" });
      }
    } catch (err) {
      setMsg({
        type: "error",
        text: err?.response?.data?.message || err.message || "Error"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      <h2 style={{ margin: 0 }}>Create Bus Route</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 900 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Route Number</label>
          <input
            value={routeNumber}
            onChange={(e) => setRouteNumber(e.target.value)}
            placeholder="e.g., 100 or EX-02"
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
            <PlaceSearch label="Select Start (search place)" onSelect={setStart} />
            {start && (
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                Start: <b>{start.label}</b>
              </div>
            )}
          </div>

          <div>
            <PlaceSearch label="Select End (search place)" onSelect={setEnd} />
            {end && (
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                End: <b>{end.label}</b>
              </div>
            )}
          </div>
        </div>

        <div>
          <PlaceSearch
            label="Add Stops (search place, appended in order)"
            onSelect={(p) => setStops((prev) => [...prev, p])}
          />

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
                      {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
                    </div>
                  </div>

                  <button type="button" onClick={() => moveStop(idx, -1)} disabled={idx === 0}>
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStop(idx, +1)}
                    disabled={idx === stops.length - 1}
                  >
                    ↓
                  </button>
                  <button type="button" onClick={() => removeStop(idx)}>
                    Remove
                  </button>
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
          {saving ? "Saving..." : "Create Route"}
        </button>
      </form>

      <div style={{ height: 420, borderRadius: 16, overflow: "hidden", border: "1px solid #eee" }}>
        <MapContainer center={center} zoom={start ? 11 : 8} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {start && (
            <Marker position={[start.lat, start.lng]}>
              <Tooltip direction="top" offset={[0, -10]} permanent>
                START
              </Tooltip>
            </Marker>
          )}

          {stops.map((s, idx) => (
            <Marker key={idx} position={[s.lat, s.lng]}>
              <Tooltip direction="top" offset={[0, -10]} permanent>
                {idx + 1}
              </Tooltip>
            </Marker>
          ))}

          {end && (
            <Marker position={[end.lat, end.lng]}>
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
