import {
  CalendarDays,
  ChevronDown,
  MapPinned,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function getStationNameById(stations, id) {
  if (!id) return "";
  const match = stations.find((station) => station._id === id);
  return match?.name || "";
}

function rankStations(stations, query) {
  const q = String(query || "").trim().toLowerCase();

  if (!q) return [...stations].sort((a, b) => a.name.localeCompare(b.name));

  const startsWith = [];
  const contains = [];

  for (const station of stations) {
    const name = String(station?.name || "").toLowerCase();

    if (name.startsWith(q)) {
      startsWith.push(station);
    } else if (name.includes(q)) {
      contains.push(station);
    }
  }

  startsWith.sort((a, b) => a.name.localeCompare(b.name));
  contains.sort((a, b) => a.name.localeCompare(b.name));

  return [...startsWith, ...contains];
}

function formatDayLabelFromDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return labels[date.getDay()];
}

function SearchableStationField({
  label,
  value,
  onChange,
  stations,
  loadingStations,
  placeholder,
  emptyHint,
}) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setInputValue(getStationNameById(stations, value));
  }, [stations, value]);

  useEffect(() => {
    function handleOutside(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filteredStations = useMemo(() => {
    return rankStations(stations, inputValue).slice(0, 8);
  }, [stations, inputValue]);

  function handleInputChange(nextValue) {
    setInputValue(nextValue);
    setOpen(true);

    const exact = stations.find(
      (station) =>
        String(station?.name || "").trim().toLowerCase() ===
        String(nextValue || "").trim().toLowerCase()
    );

    onChange(exact?._id || "");
  }

  function handleSelect(station) {
    setInputValue(station.name);
    onChange(station._id);
    setOpen(false);
  }

  function handleBlurValidation() {
    const trimmed = String(inputValue || "").trim();

    if (!trimmed) {
      onChange("");
      return;
    }

    const exact = stations.find(
      (station) =>
        String(station?.name || "").trim().toLowerCase() ===
        trimmed.toLowerCase()
    );

    if (exact) {
      setInputValue(exact.name);
      onChange(exact._id);
    }
  }

  return (
    <div ref={wrapperRef}>
      <label className="mb-2 block text-xs font-medium text-zinc-400">
        {label}
      </label>

      <div className="relative">
        <MapPinned className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-zinc-500" />

        <input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={handleBlurValidation}
          disabled={loadingStations}
          placeholder={placeholder}
          autoComplete="off"
          className="h-12 w-full rounded-2xl border border-cyan-400/15 bg-slate-950/70 py-3 pl-10 pr-10 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400/45"
        />

        {open && !loadingStations && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-72 overflow-y-auto rounded-[22px] border border-white/10 bg-[#1f1f22] py-2 shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
            {filteredStations.length > 0 ? (
              filteredStations.map((station) => (
                <button
                  key={station._id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(station)}
                  className="block w-full px-5 py-3 text-left text-base font-medium text-white transition hover:bg-white/5"
                >
                  {station.name}
                </button>
              ))
            ) : (
              <div className="px-5 py-3 text-sm text-zinc-400">
                No matching stations
              </div>
            )}
          </div>
        )}
      </div>

      {emptyHint ? (
        <p className="mt-2 text-[11px] text-zinc-500">{emptyHint}</p>
      ) : null}
    </div>
  );
}

export default function PlanJourneySection({
  stations,
  loadingStations,
  fromStationId,
  onFromChange,
  destinationStationId,
  onDestinationChange,
  travelDate,
  onTravelDateChange,
  onSearch,
  canSearch,
  searching,
}) {
  const derivedDay = formatDayLabelFromDate(travelDate);

  return (
    <section className="rounded-[24px] border border-white/10 bg-black/20 p-4">
      <div className="mb-4 border-b border-white/10 pb-3 text-xl font-semibold text-white">
        Plan Journey
      </div>

      <div className="space-y-4">
        <SearchableStationField
          label="From Station (Optional)"
          value={fromStationId}
          onChange={onFromChange}
          stations={stations}
          loadingStations={loadingStations}
          placeholder="Type station name or use current location"
          emptyHint="Leave empty to use your current location."
        />

        <SearchableStationField
          label="Destination Station"
          value={destinationStationId}
          onChange={onDestinationChange}
          stations={stations}
          loadingStations={loadingStations}
          placeholder="Type destination station name"
        />

        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-400">
            Travel Date
          </label>

          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

            <input
              type="date"
              value={travelDate}
              onChange={(e) => onTravelDateChange(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="h-12 w-full rounded-2xl border border-cyan-400/15 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-cyan-400/45"
            />
          </div>

          {derivedDay ? (
            <p className="mt-2 text-[11px] text-cyan-300/80">
              Selected running day: {derivedDay}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onSearch}
          disabled={!canSearch || searching}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Search className="mr-2 h-4 w-4" />
          {searching ? "Searching..." : "Search Trains"}
        </button>
      </div>
    </section>
  );
}