import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Crosshair, Minus, Plus } from "lucide-react";
import { fixLeafletIcon } from "../lib/leafletIcons";
import StationStatusLegend from "./StationStatusLegend";

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

function FitViewport({ stations, tempPick, center }) {
  const map = useMap();

  const points = useMemo(() => {
    const stationPoints = stations
      .map((station) => {
        const lat = station?.location?.lat;
        const lng = station?.location?.lng;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return [lat, lng];
      })
      .filter(Boolean);

    if (tempPick) {
      stationPoints.push([tempPick.lat, tempPick.lng]);
    }

    return stationPoints;
  }, [stations, tempPick]);

  useEffect(() => {
    if (!points.length) {
      map.setView(center, 12);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    map.fitBounds(points, { padding: [50, 50] });
  }, [center, map, points]);

  return null;
}

function MapQuickActions({ center }) {
  const map = useMap();

  const Button = ({ children, onClick, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-300/80 bg-white/95 text-slate-700 shadow-[0_14px_30px_rgba(0,0,0,0.18)] backdrop-blur transition hover:bg-white hover:text-slate-900"
    >
      {children}
    </button>
  );

  return (
    <div className="absolute right-4 top-4 z-[500] grid gap-3">
      <Button onClick={() => map.zoomIn()} title="Zoom in">
        <Plus className="h-4 w-4" />
      </Button>
      <Button onClick={() => map.zoomOut()} title="Zoom out">
        <Minus className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => map.setView(center, Math.max(map.getZoom(), 12))}
        title="Recenter map"
      >
        <Crosshair className="h-4 w-4" />
      </Button>
    </div>
  );
}

function MapInfoBanner({ pickMode, stationCount }) {
  return (
    <div className="absolute left-4 top-4 z-[500] max-w-[340px] rounded-2xl border border-slate-300/80 bg-white/95 px-4 py-3 text-slate-800 shadow-[0_25px_60px_rgba(0,0,0,0.18)] backdrop-blur">
      <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
        Network map
      </div>

      <div className="mt-1 text-sm font-semibold">
        {pickMode ? "Picker mode enabled" : "Live station overview"}
      </div>

      <p className="mt-1 text-xs leading-5 text-slate-600">
        {pickMode
          ? "Click anywhere on the map to capture latitude, longitude, and auto-fill address details."
          : `${stationCount} saved station${stationCount === 1 ? "" : "s"} currently visible on the map.`}
      </p>
    </div>
  );
}

function getStationPopupStatusLabel(isActive) {
  return isActive ? "Operational" : "Inactive";
}

export default function StationMapPanel({
  stations,
  tempPick,
  pickMode,
  onPick,
  center,
  activeCount,
}) {
  return (
    <div className="station-map-wrap relative h-full min-h-0 w-full overflow-hidden">
      <MapContainer
        center={center}
        zoom={12}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickPicker enabled={pickMode} onPick={onPick} />
        <FitViewport stations={stations} tempPick={tempPick} center={center} />
        <MapQuickActions center={center} />

        {tempPick ? (
          <Marker position={[tempPick.lat, tempPick.lng]}>
            <Popup>
              <div className="space-y-1 text-xs">
                <div className="text-sm font-semibold text-slate-900">
                  Selected point
                </div>
                <div>
                  {tempPick.lat.toFixed(6)}, {tempPick.lng.toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        ) : null}

        {stations.map((station) => (
          <Marker
            key={station._id}
            position={[station.location.lat, station.location.lng]}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <div className="text-sm font-semibold text-slate-900">
                  {station.name}
                </div>
                {station.address ? <div>{station.address}</div> : null}
                <div>
                  {station.location.lat.toFixed(6)}, {station.location.lng.toFixed(6)}
                </div>
                <div>{getStationPopupStatusLabel(station.isActive)}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <MapInfoBanner pickMode={pickMode} stationCount={stations.length} />
      <StationStatusLegend
        totalCount={stations.length}
        activeCount={activeCount}
        hasTempPick={Boolean(tempPick)}
      />
    </div>
  );
}