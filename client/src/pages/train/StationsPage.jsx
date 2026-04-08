import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";

import "./components/stations/stations-theme.css";
import StationSidebarHeader from "./components/stations/StationSidebarHeader";
import StationSearchBar from "./components/stations/StationSearchBar";
import StationAlert from "./components/stations/StationAlert";
import StationFormCard from "./components/stations/StationFormCard";
import StationListSection from "./components/stations/StationListSection";
import StationMapPanel from "./components/stations/StationMapPanel";

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
  const [tempPick, setTempPick] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [msg, setMsg] = useState("");
  const [msgTone, setMsgTone] = useState("warning");

  const center = useMemo(() => {
    if (tempPick) return [tempPick.lat, tempPick.lng];

    if (stations.length > 0) {
      const first = stations[0];
      return [first.location.lat, first.location.lng];
    }

    return [6.9271, 79.8612];
  }, [stations, tempPick]);

  const filteredStations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return stations;

    return stations.filter((station) => {
      const nameText = String(station?.name || "").toLowerCase();
      const addressText = String(station?.address || "").toLowerCase();
      return nameText.includes(q) || addressText.includes(q);
    });
  }, [stations, searchTerm]);

  const activeCount = useMemo(
    () => stations.filter((station) => station?.isActive).length,
    [stations]
  );

  async function loadStations() {
    setLoading(true);
    setMsg("");

    try {
      const res = await api.get("/api/admin/train/stations");
      setStations(res.data.stations || []);
    } catch (e) {
      setMsgTone("warning");
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

    if (!name.trim()) {
      setMsgTone("warning");
      return setMsg("Station name required");
    }

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      setMsgTone("warning");
      return setMsg("Valid lat/lng required");
    }

    try {
      const res = await api.post("/api/admin/train/stations", {
        name: name.trim(),
        address: address.trim(),
        lat: latNum,
        lng: lngNum,
        isActive,
      });

      setStations((prev) => [res.data.station, ...prev]);
      setMsgTone("success");
      setMsg("Station created successfully");

      setName("");
      setAddress("");
      setLat("");
      setLng("");
      setIsActive(true);
      setPickMode(false);
      setTempPick(null);
    } catch (e2) {
      setMsgTone("warning");
      setMsg(e2?.response?.data?.message || "Create failed");
    }
  }

  async function onDelete(id) {
    setMsg("");

    try {
      await api.delete(`/api/admin/train/stations/${id}`);
      setStations((prev) => prev.filter((station) => station._id !== id));
      setMsgTone("success");
      setMsg("Station deleted successfully");
    } catch (e) {
      setMsgTone("warning");
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
    <div className="station-admin-shell h-screen overflow-hidden bg-[#040914] p-3 text-white">
      <div className="mx-auto grid h-[calc(100vh-24px)] max-w-[1800px] overflow-hidden rounded-[28px] border border-white/8 bg-[#060d18] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_80px_rgba(0,0,0,0.45)] lg:grid-cols-[430px_minmax(0,1fr)] xl:grid-cols-[460px_minmax(0,1fr)]">
        <aside className="h-full overflow-y-auto border-b border-white/6 bg-[linear-gradient(180deg,rgba(10,18,30,0.98)_0%,rgba(6,12,22,0.98)_100%)] lg:border-b-0 lg:border-r lg:border-r-white/6">
          <div className="flex min-h-full flex-col p-4">
            <StationSidebarHeader />

            <StationSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onRefresh={loadStations}
              refreshing={loading}
            />

            <div className="mt-6 flex flex-col gap-4">
              {msg ? <StationAlert tone={msgTone} message={msg} /> : null}

              <StationFormCard
                name={name}
                setName={setName}
                address={address}
                setAddress={setAddress}
                lat={lat}
                setLat={setLat}
                lng={lng}
                setLng={setLng}
                isActive={isActive}
                setIsActive={setIsActive}
                pickMode={pickMode}
                setPickMode={setPickMode}
                geoLoading={geoLoading}
                onSubmit={onCreate}
              />

              <StationListSection
                stations={stations}
                filteredStations={filteredStations}
                loading={loading}
                activeCount={activeCount}
                searchTerm={searchTerm}
                onDelete={onDelete}
              />
            </div>
          </div>
        </aside>

        <main className="relative h-full min-h-0 overflow-hidden bg-[#0b1220]">
          <StationMapPanel
            stations={stations}
            tempPick={tempPick}
            pickMode={pickMode}
            onPick={onPick}
            center={center}
            activeCount={activeCount}
          />
        </main>
      </div>
    </div>
  );
}