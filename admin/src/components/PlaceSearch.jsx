import { useEffect, useMemo, useState } from "react";

function useDebounce(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function PlaceSearch({ label, onSelect }) {
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 450);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({
      q: dq,
      format: "json",
      limit: "6"
    });
    return `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  }, [dq]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!dq || dq.trim().length < 3) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(endpoint, {
          headers: { "Accept-Language": "en" }
        });
        const data = await res.json();

        if (cancelled) return;
        const mapped = (data || []).map((d) => ({
          label: d.display_name,
          lat: Number(d.lat),
          lng: Number(d.lon)
        }));
        setItems(mapped);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [endpoint, dq]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label style={{ fontWeight: 600 }}>{label}</label>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search a place (min 3 chars)..."
        style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
      />

      {loading && <small>Searching...</small>}

      {items.length > 0 && (
        <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
          {items.map((it, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSelect(it);
                setItems([]);
                setQ("");
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: 10,
                border: "none",
                borderBottom: "1px solid #f2f2f2",
                background: "white",
                cursor: "pointer"
              }}
            >
              {it.label}
              <div style={{ opacity: 0.7, fontSize: 12 }}>{it.lat.toFixed(5)}, {it.lng.toFixed(5)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
