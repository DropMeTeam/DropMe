import { useEffect, useMemo, useRef, useState } from "react";

export default function PlaceSearch({
  label = "Location",
  placeholder = "Search location",
  value = "",
  onValueChange,
  onSelect,

  minChars = 3,
  limit = 6,
  debounceMs = 350,

  countryCodes = "lk",
  viewbox = "79.35,9.95,81.90,5.85",
  bounded = false,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const abortRef = useRef(null);

  const q = value || "";
  const canSearch = q.trim().length >= minChars;

  const queryParams = useMemo(() => {
    const p = {
      q,
      format: "json",
      addressdetails: "1",
      limit: String(limit),
    };
    if (countryCodes) p.countrycodes = countryCodes;
    if (viewbox) p.viewbox = viewbox;
    if (bounded) p.bounded = "1";
    return p;
  }, [q, limit, countryCodes, viewbox, bounded]);

  useEffect(() => {
    function onDocClick(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!canSearch) {
      setItems([]);
      setOpen(false);
      setActiveIndex(-1);
      if (abortRef.current) abortRef.current.abort();
      return;
    }

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setOpen(true);

        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const url =
          "https://nominatim.openstreetmap.org/search?" +
          new URLSearchParams(queryParams).toString();

        const res = await fetch(url, {
          signal: controller.signal,
          headers: { "Accept-Language": "en" },
        });

        const data = await res.json();
        const mapped = (data || []).map((d) => ({
          label: d.display_name,
          lat: Number(d.lat),
          lng: Number(d.lon),
        }));

        setItems(mapped);
        setActiveIndex(mapped.length ? 0 : -1);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setItems([]);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(t);
  }, [canSearch, debounceMs, queryParams]);

  function commit(item) {
    if (!item) return;
    onValueChange?.(item.label);
    setOpen(false);
    setItems([]);
    setActiveIndex(-1);
    onSelect?.(item);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!open || !items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit(items[activeIndex]);
    }
  }

  return (
    <div ref={rootRef} className="w-full">
      <label className="block text-sm text-white/70 mb-2">{label}</label>

      <div className="relative">
        <input
          value={q}
          onChange={(e) => {
            onValueChange?.(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (items.length) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/30"
        />

        {loading && (
          <div className="absolute right-3 top-3 text-xs text-white/50">
            Searching...
          </div>
        )}

        {open && items.length > 0 && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F19] shadow-xl overflow-hidden">
            {items.map((it, idx) => (
              <button
                key={`${it.lat},${it.lng},${idx}`}
                type="button"
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => commit(it)}
                className={
                  "w-full text-left px-4 py-3 text-sm transition " +
                  (idx === activeIndex
                    ? "bg-white/10 text-white"
                    : "hover:bg-white/5 text-white/80")
                }
              >
                {it.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
