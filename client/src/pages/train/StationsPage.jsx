import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import api from "../../lib/api";
import { fixLeafletIcon } from "./lib/leafletIcons";

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
  const [address, setAddress] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [pickMode, setPickMode] = useState(false);
  const [msg, setMsg] = useState("");

  const [tempPick, setTempPick] = useState(null); // {lat,lng}

  const center = useMemo(() => {
    if (tempPick) return [tempPick.lat, tempPick.lng];
    if (stations.length > 0) {
      const s = stations[0];
      return [s.location.lat, s.location.lng];
    }
    return [6.9271, 79.8612]; // Colombo
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

  async function reverseGeocode(latNum, lngNum) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latNum}&lon=${lngNum}`;
    setGeoLoading(true);
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
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
        address: address.trim(),
        lat: latNum,
        lng: lngNum,
        isActive,
      });

      setStations((prev) => [res.data.station, ...prev]);

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

  async function onPick({ lat, lng }) {
    const latStr = lat.toFixed(6);
    const lngStr = lng.toFixed(6);

    setLat(latStr);
    setLng(lngStr);
    setTempPick({ lat, lng });
    setPickMode(false);

    const place = await reverseGeocode(latStr, lngStr);
    if (place) setAddress(place);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
      {/* Left panel */}
      <div className="card p-4">
        <h3 className="text-lg font-semibold">Add Station</h3>

        {msg ? (
          <div className="mt-3 rounded-xl border border-yellow-300/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
            {msg}
          </div>
        ) : null}

        <form onSubmit={onCreate} className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm text-zinc-300">
            Station Name
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Colombo Fort"
            />
          </label>

          <label className="grid gap-1 text-sm text-zinc-300">
            Location Name (auto)
            <input
              className="input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={geoLoading ? "Resolving location..." : "Pick on map to auto-fill"}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-sm text-zinc-300">
              Lat
              <input className="input" value={lat} onChange={(e) => setLat(e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm text-zinc-300">
              Lng
              <input className="input" value={lng} onChange={(e) => setLng(e.target.value)} />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPickMode((v) => !v)}
              className="pill"
            >
              {pickMode ? "Picking… click map" : "Pick on map"}
            </button>

            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active
            </label>

            <button
              type="submit"
              className="pill pill-active ml-auto"
              disabled={geoLoading}
              title={geoLoading ? "Wait for location lookup" : "Save station"}
            >
              Save
            </button>
          </div>
        </form>

        <hr className="my-4 border-zinc-800" />

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Stations</h3>
          <button onClick={loadStations} className="pill">
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        <div className="mt-3 grid gap-2 max-h-[420px] overflow-auto pr-1">
          {stations.map((s) => (
            <div key={s._id} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{s.name}</div>
                  {s.address ? (
                    <div className="mt-1 text-xs text-zinc-400">{s.address}</div>
                  ) : null}
                  <div className="mt-1 text-xs text-zinc-400">
                    {s.location.lat.toFixed(5)}, {s.location.lng.toFixed(5)} •{" "}
                    {s.isActive ? "Active" : "Inactive"}
                  </div>
                </div>

                <button onClick={() => onDelete(s._id)} className="pill">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {stations.length === 0 ? <div className="text-sm text-zinc-400">No stations yet.</div> : null}
        </div>
      </div>

      {/* Map panel */}
      <div className="card overflow-hidden" style={{ height: 620 }}>
        <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickPicker enabled={pickMode} onPick={onPick} />

          {tempPick ? (
            <Marker position={[tempPick.lat, tempPick.lng]}>
              <Popup>
                <div style={{ fontWeight: 700 }}>Selected point</div>
                <div style={{ fontSize: 12 }}>
                  {tempPick.lat.toFixed(6)}, {tempPick.lng.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          ) : null}

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
