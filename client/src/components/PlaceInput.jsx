import { useEffect, useRef, useState } from "react";
import { geoSearch } from "../lib/geoApi";

export default function PlaceInput({
  label,
  placeholder,
  valueLabel,
  onValueLabelChange,
  onSelect,
}) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const boxRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const q = String(valueLabel || "").trim();

    // no query -> close
    if (!q) {
      setItems([]);
      setOpen(false);
      setErr("");
      return;
    }

    // debounce
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        setBusy(true);
        setErr("");
        const res = await geoSearch(q);
        setItems(res);
        setOpen(true);
      } catch (e) {
        setItems([]);
        setOpen(false);
        setErr("Search failed");
      } finally {
        setBusy(false);
      }
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [valueLabel]);

  return (
    <div className="grid gap-2" ref={boxRef}>
      <label className="text-sm text-white/70">{label}</label>

      <div className="relative">
        <input
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
          placeholder={placeholder}
          value={valueLabel || ""}
          onChange={(e) => onValueLabelChange?.(e.target.value)}
          onFocus={() => {
            if (items.length) setOpen(true);
          }}
        />

        {busy ? (
          <div className="absolute right-3 top-3 text-xs text-white/50">…</div>
        ) : null}

        {open && items.length ? (
          <div className="absolute z-[9999] mt-2 w-full rounded-xl border border-white/10 bg-[#0b1020] overflow-hidden">
            {items.map((it, idx) => (
              <button
                key={`${it.lat}-${it.lng}-${idx}`}
                type="button"
                className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10"
                onClick={() => {
                  setOpen(false);
                  const p = { label: it.label, lat: it.lat, lng: it.lng };
                  onValueLabelChange?.(it.label);
                  onSelect?.(p);
                }}
              >
                {it.label}
              </button>
            ))}
          </div>
        ) : null}

        {err ? <div className="mt-2 text-xs text-red-300">{err}</div> : null}
      </div>
    </div>
  );
}