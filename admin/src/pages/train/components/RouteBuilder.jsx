import { useMemo } from "react";
import { getLatLng, distanceToSegmentKm, alongFactor } from "../lib/geo";

export default function RouteBuilder({
  stations,
  startId, setStartId,
  endId, setEndId,
  stopsOrdered,
  onAddIntermediate,
  onAddStop,
  onRemoveStop,
  onUpdateStopStation,
}) {
  const stationById = useMemo(() => {
    const m = new Map();
    stations.forEach((s) => m.set(String(s._id), s));
    return m;
  }, [stations]);

  const betweenStations = useMemo(() => {
    const A = stationById.get(String(startId));
    const B = stationById.get(String(endId));
    const a = getLatLng(A);
    const b = getLatLng(B);
    if (!a || !b) return [];

    const corridorKm = 3;
    const used = new Set(stopsOrdered.map((s) => String(s.stationId)).filter(Boolean));

    const items = [];
    for (const st of stations) {
      const id = String(st._id);
      if (id === String(startId) || id === String(endId)) continue;

      const p = getLatLng(st);
      if (!p) continue;

      const d = distanceToSegmentKm(p, a, b);
      const t = alongFactor(p, a, b);
      const isBetween = t > 0.02 && t < 0.98 && d <= corridorKm;

      if (isBetween) items.push({ _id: id, name: st.name, t, disabled: used.has(id) });
    }

    items.sort((x, y) => x.t - y.t);
    return items;
  }, [stations, stationById, startId, endId, stopsOrdered]);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label>
          Start Station (A)
          <select value={startId} onChange={(e) => setStartId(e.target.value)} style={{ width: "100%", padding: 8 }}>
            <option value="">Select...</option>
            {stations.map((st) => (
              <option key={st._id} value={st._id}>{st.name}</option>
            ))}
          </select>
        </label>

        <label>
          End Station (B)
          <select value={endId} onChange={(e) => setEndId(e.target.value)} style={{ width: "100%", padding: 8 }}>
            <option value="">Select...</option>
            {stations.map((st) => (
              <option key={st._id} value={st._id}>{st.name}</option>
            ))}
          </select>
        </label>
      </div>

      {!!startId && !!endId && (
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 10, marginTop: 10 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Stations between A → B (auto-suggested)</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {betweenStations.slice(0, 12).map((x) => (
              <button
                key={x._id}
                type="button"
                disabled={x.disabled}
                onClick={() => onAddIntermediate(x._id)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid #ddd",
                  cursor: x.disabled ? "not-allowed" : "pointer",
                  opacity: x.disabled ? 0.5 : 1,
                }}
              >
                + {x.name}
              </button>
            ))}
            {betweenStations.length === 0 && <div style={{ opacity: 0.75 }}>No suggested stations found.</div>}
          </div>
        </div>
      )}

      <div style={{ marginTop: 14, fontWeight: 900 }}>Stops (ordered) — NO manual times here</div>

      {stopsOrdered.map((s, idx) => (
        <div key={s.key} style={{ display: "grid", gridTemplateColumns: "1.3fr 120px", gap: 8, marginTop: 8 }}>
          <select
            value={s.stationId}
            onChange={(e) => onUpdateStopStation(s.key, e.target.value)}
            style={{ padding: 8 }}
            disabled={(idx === 0 && !!startId) || (idx === stopsOrdered.length - 1 && !!endId)}
          >
            <option value="">Select station...</option>
            {stations.map((st) => (
              <option key={st._id} value={st._id}>{st.name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onRemoveStop(s.key)}
            disabled={stopsOrdered.length <= 2 || idx === 0 || idx === stopsOrdered.length - 1}
            style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
          >
            Remove
          </button>
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button type="button" onClick={onAddStop} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd" }}>
          + Add Stop (manual)
        </button>
      </div>
    </>
  );
}
