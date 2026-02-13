import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import api from "../../lib/api";
import { fixLeafletIcon } from "../../lib/leafletIcons";

fixLeafletIcon();

function ClickPicker({ enabled, onPick }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function StationsPage() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [pickMode, setPickMode] = useState(false);
  const [msg, setMsg] = useState("");

  const center = useMemo(() => {
    if (stations.length > 0) {
      const s = stations[0];
      return [s.location.lat, s.location.lng];
    }
    return [6.9271, 79.8612]; // Colombo default
  }, [stations]);

  async function loadStations() {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/api/admin/train/stations");
      setStations(res.data.stations || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load stations (check admin role / token)");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStations();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setMsg("");

    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!name.trim()) return setMsg("Station name required");
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return setMsg("Valid lat/lng required");

    try {
      const res = await api.post("/api/admin/train/stations", {
        name: name.trim(),
        lat: latNum,
        lng: lngNum,
        isActive,
      });

      // fast local update without refetch
      setStations((prev) => [res.data.station, ...prev]);
      setName("");
      setLat("");
      setLng("");
      setIsActive(true);
      setPickMode(false);
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Create failed");
    }
  }

  async function onDelete(id) {
    setMsg("");
    try {
      await api.delete(`/api/admin/train/stations/${id}`);
      setStations((prev) => prev.filter((s) => s._id !== id));
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    }
  }

  function onPick({ lat, lng }) {
    setLat(lat.toFixed(6));
    setLng(lng.toFixed(6));
    setPickMode(false);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 16 }}>
      <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Add Station</h3>

        {msg && (
          <div style={{ background: "#fff3cd", border: "1px solid #ffeeba", padding: 10, borderRadius: 8, marginBottom: 10 }}>
            {msg}
          </div>
        )}

        <form onSubmit={onCreate} style={{ display: "grid", gap: 10 }}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label>
              Lat
              <input value={lat} onChange={(e) => setLat(e.target.value)} style={{ width: "100%", padding: 8 }} />
            </label>
            <label>
              Lng
              <input value={lng} onChange={(e) => setLng(e.target.value)} style={{ width: "100%", padding: 8 }} />
            </label>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setPickMode((v) => !v)}
              style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
            >
              {pickMode ? "Picking… click map" : "Pick on map"}
            </button>

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active
            </label>

            <button type="submit" style={{ marginLeft: "auto", padding: "8px 12px", borderRadius: 10, border: "1px solid #111", cursor: "pointer" }}>
              Save
            </button>
          </div>
        </form>

        <hr style={{ margin: "14px 0" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>Stations</h3>
          <button onClick={loadStations} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 8, maxHeight: 420, overflow: "auto" }}>
          {stations.map((s) => (
            <div key={s._id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {s.location.lat.toFixed(5)}, {s.location.lng.toFixed(5)} • {s.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
                <button
                  onClick={() => onDelete(s._id)}
                  style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #f1c0c0", cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {stations.length === 0 && <div style={{ opacity: 0.7 }}>No stations yet.</div>}
        </div>
      </div>

      <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden", height: 620 }}>
        <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickPicker enabled={pickMode} onPick={onPick} />

          {stations.map((s) => (
            <Marker key={s._id} position={[s.location.lat, s.location.lng]}>
              <Popup>
                <div style={{ fontWeight: 700 }}>{s.name}</div>
                <div style={{ fontSize: 12 }}>
                  {s.location.lat.toFixed(6)}, {s.location.lng.toFixed(6)}
                </div>
                <div style={{ fontSize: 12 }}>{s.isActive ? "Active" : "Inactive"}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
