import { useEffect, useMemo, useRef, useState } from "react";

export default function PlaceSearch({
  label = "Location",
  placeholder = "Search location",
  onSelect,

  // Tuning knobs (enterprise-friendly)
  minChars = 3,
  limit = 6,
  debounceMs = 350,

  // Nominatim result quality knobs
  countryCodes = "lk", // Sri Lanka default (set "" to disable)
  // Rough bbox around Sri Lanka to bias results (optional)
  viewbox = "79.35,9.95,81.90,5.85", // left,top,right,bottom
  bounded = false, // set true to restrict strictly within viewbox
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [status, setStatus] = useState("idle"); // idle | ok | empty | error

  const rootRef = useRef(null);
  const abortRef = useRef(null);

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

  // Close dropdown on outside click
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

  // Search effect (debounced + abortable)
  useEffect(() => {
    if (!canSearch) {
      setItems([]);
      setOpen(false);
      setActiveIndex(-1);
      setStatus("idle");
      if (abortRef.current) abortRef.current.abort();
      return;
    }

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setStatus("idle");
        setOpen(true);

        // Abort previous request
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const url =
          "https://nominatim.openstreetmap.org/search?" +
          new URLSearchParams(queryParams).toString();

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "Accept-Language": "en",
            // Nominatim etiquette (safe, not required):
            // If you have a domain/email later, put it here.
          },
        });

        const data = await res.json();

        const mapped = (data || []).map((d) => ({
          display: d.display_name,
          lat: Number(d.lat),
          lng: Number(d.lon),
          raw: d,
        }));

        setItems(mapped);
        setActiveIndex(mapped.length ? 0 : -1);
        setStatus(mapped.length ? "ok" : "empty");
      } catch (e) {
        // Ignore abort errors
        if (e?.name === "AbortError") return;
        setItems([]);
        setActiveIndex(-1);
        setStatus("error");
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(t);
  }, [canSearch, debounceMs, queryParams]);

  function commitSelection(item) {
    if (!item) return;
    setQ(item.display);
    setOpen(false);
    setItems([]);
    setActiveIndex(-1);
    onSelect?.(item);
  }

  function onKeyDown(e) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      if (canSearch) setOpen(true);
    }

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
      commitSelection(items[activeIndex]);
    }
  }

  return (
    <div ref={rootRef} className="w-full">
      {label && <label className="block text-sm text-white/70 mb-2">{label}</label>}

      <div className="relative">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
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

        {open && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F19] shadow-xl overflow-hidden">
            {!canSearch && (
              <div className="px-4 py-3 text-sm text-white/60">
                Type at least {minChars} characters…
              </div>
            )}

            {canSearch && status === "empty" && (
              <div className="px-4 py-3 text-sm text-white/60">
                No results found.
              </div>
            )}

            {canSearch && status === "error" && (
              <div className="px-4 py-3 text-sm text-red-300">
                Search failed. Try again.
              </div>
            )}

            {canSearch &&
              items.map((it, idx) => (
                <button
                  key={`${it.lat},${it.lng},${idx}`}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => commitSelection(it)}
                  className={
                    "w-full text-left px-4 py-3 text-sm transition " +
                    (idx === activeIndex
                      ? "bg-white/10 text-white"
                      : "hover:bg-white/5 text-white/80")
                  }
                >
                  {it.display}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
