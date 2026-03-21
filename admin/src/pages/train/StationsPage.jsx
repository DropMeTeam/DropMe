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
  const [address, setAddress] = useState("");      // ✅ NEW
  const [geoLoading, setGeoLoading] = useState(false); // ✅ NEW

  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [pickMode, setPickMode] = useState(false);
  const [msg, setMsg] = useState("");

  // Optional: show a temporary marker when you pick a point (before saving)
  const [tempPick, setTempPick] = useState(null); // {lat,lng}

  const center = useMemo(() => {
    if (tempPick) return [tempPick.lat, tempPick.lng];
    if (stations.length > 0) {
      const s = stations[0];
      return [s.location.lat, s.location.lng];
    }
    return [6.9271, 79.8612]; // Colombo default
  }, [stations, tempPick]);

  async function loadStations() {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/api/admin/train/stations");
      setStations(res.data.stations || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load stations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStations();
  }, []);

  // ✅ Free reverse geocoding using OSM Nominatim
  async function reverseGeocode(latNum, lngNum) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latNum}&lon=${lngNum}`;

    setGeoLoading(true);
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      return data?.display_name || "";
    } catch {
      return "";
    } finally {
      setGeoLoading(false);
    }
  }

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
        address: address.trim(), // ✅ send address (safe)
        lat: latNum,
        lng: lngNum,
        isActive,
      });

      setStations((prev) => [res.data.station, ...prev]);

      // reset form
      setName("");
      setAddress("");
      setLat("");
      setLng("");
      setIsActive(true);
      setPickMode(false);
      setTempPick(null);
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

  // ✅ Now onPick also fills location name
  async function onPick({ lat, lng }) {
    const latStr = lat.toFixed(6);
    const lngStr = lng.toFixed(6);

    setLat(latStr);
    setLng(lngStr);
    setTempPick({ lat, lng });
    setPickMode(false);

    // auto-fill location name
    const place = await reverseGeocode(latStr, lngStr);
    if (place) setAddress(place);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 16 }}>
      <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Add Station</h3>

        {msg && (
          <div
            style={{
              background: "#fff3cd",
              border: "1px solid #ffeeba",
              padding: 10,
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            {msg}
          </div>
        )}

        <form onSubmit={onCreate} style={{ display: "grid", gap: 10 }}>
          <label>
            Station Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: 8 }}
              placeholder="e.g., Colombo Fort"
            />
          </label>

          <label>
            Location Name (auto)
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ width: "100%", padding: 8 }}
              placeholder={geoLoading ? "Resolving location..." : "Click Pick on map to auto-fill"}
            />
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

            <button
              type="submit"
              style={{
                marginLeft: "auto",
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #111",
                cursor: "pointer",
              }}
              disabled={geoLoading}
              title={geoLoading ? "Wait for location lookup" : "Save station"}
            >
              Save
            </button>
          </div>
        </form>

        <hr style={{ margin: "14px 0" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>Stations</h3>
          <button
            onClick={loadStations}
            style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 8, maxHeight: 420, overflow: "auto" }}>
          {stations.map((s) => (
            <div key={s._id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.name}</div>

                  {s.address ? (
                    <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{s.address}</div>
                  ) : null}

                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
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
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickPicker enabled={pickMode} onPick={onPick} />

          {/* temp marker before saving */}
          {tempPick && (
            <Marker position={[tempPick.lat, tempPick.lng]}>
              <Popup>
                <div style={{ fontWeight: 700 }}>Selected point</div>
                <div style={{ fontSize: 12 }}>
                  {tempPick.lat.toFixed(6)}, {tempPick.lng.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )}

          {stations.map((s) => (
            <Marker key={s._id} position={[s.location.lat, s.location.lng]}>
              <Popup>
                <div style={{ fontWeight: 700 }}>{s.name}</div>
                {s.address ? <div style={{ fontSize: 12, marginTop: 4 }}>{s.address}</div> : null}
                <div style={{ fontSize: 12, marginTop: 4 }}>
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
