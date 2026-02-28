import { useEffect, useMemo, useRef, useState } from "react";
import api from "../lib/api"; // ✅ uses your axios instance

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
  const [err, setErr] = useState(null);

  const rootRef = useRef(null);
  const abortRef = useRef(null);

  const q = value || "";
  const canSearch = q.trim().length >= minChars;

  // keep same params (so backend can forward them)
  const queryParams = useMemo(() => {
    const p = { q, limit: String(limit) };
    if (countryCodes) p.countryCodes = countryCodes;
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
    setErr(null);

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

        // ✅ IMPORTANT: call YOUR backend proxy (no CORS issues)
        // server must have: app.use("/api/geo", geoRouter)
        const res = await api.get("/api/geo/search", {
          params: queryParams,
          signal: controller.signal,
        });

        const mapped = (res.data?.results || []).map((d) => ({
          label: d.label,
          lat: Number(d.lat),
          lng: Number(d.lng),
        }));

        setItems(mapped);
        setActiveIndex(mapped.length ? 0 : -1);
      } catch (e) {
        if (e?.name === "CanceledError") return; // axios cancel
        if (e?.name === "AbortError") return;

        setErr(e?.response?.data?.message || e.message || "Search failed");
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

        {err && !loading && (
          <div className="mt-2 text-xs text-red-300">
            {err}
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