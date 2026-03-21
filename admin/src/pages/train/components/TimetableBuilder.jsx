import { useEffect, useMemo, useState } from "react";
import { minutesFromHHMM, hhmmFromMinutes } from "../lib/time";

export default function TimetableBuilder({
  stopsOrdered,
  segments,
  defaultDwell = 20,
  onGeneratedTimesChange, // (generatedStopsTimes) => void
}) {
  const [startHHMM, setStartHHMM] = useState("09:00");
  const [dwellMin, setDwellMin] = useState(defaultDwell);
  const [rows, setRows] = useState([]);

  const names = useMemo(
    () => stopsOrdered.map((s) => s.station?.name || "—"),
    [stopsOrdered]
  );

  function build(baseStartMinutes, dwell) {
    if (!stopsOrdered.length) return [];

    // If segments not ready, keep minimal values
    if (!segments || segments.length !== stopsOrdered.length - 1) {
      return stopsOrdered.map((_, idx) => ({
        idx,
        name: names[idx],
        arrival: idx === 0 ? "" : "",
        departure: idx === 0 ? hhmmFromMinutes(baseStartMinutes) : "",
      }));
    }

    let dep = baseStartMinutes;
    const out = [];

    for (let i = 0; i < stopsOrdered.length; i++) {
      if (i === 0) {
        out.push({
          idx: i,
          name: names[i],
          arrival: "",
          departure: hhmmFromMinutes(dep),
        });
        continue;
      }

      const seg = segments[i - 1];
      const arr = dep + (seg?.durationMin || 0);

      const isLast = i === stopsOrdered.length - 1;

      if (isLast) {
        // ✅ backend requires departureTime even for last station
        out.push({
          idx: i,
          name: names[i],
          arrival: hhmmFromMinutes(arr),
          departure: hhmmFromMinutes(arr), // last departure = arrival
        });
        dep = arr;
      } else {
        const nextDep = arr + dwell;
        out.push({
          idx: i,
          name: names[i],
          arrival: hhmmFromMinutes(arr),
          departure: hhmmFromMinutes(nextDep),
        });
        dep = nextDep;
      }
    }

    return out;
  }

  // rebuild when inputs change
  useEffect(() => {
    const base = minutesFromHHMM(startHHMM);
    if (base == null) return;

    const r = build(base, Number(dwellMin) || 0);
    setRows(r);

    // ✅ generate payload for backend (arrivalTime + departureTime REQUIRED)
    const generatedStops = stopsOrdered.map((s, idx) => {
      const arrival = r[idx]?.arrival || "";
      let departure = r[idx]?.departure || "";

      // last stop must have departureTime too
      if (idx === stopsOrdered.length - 1) {
        departure = departure || arrival;
      }

      return {
        stationId: s.stationId,
        order: s.order,
        arrivalTime: arrival,
        departureTime: departure,
      };
    });

    onGeneratedTimesChange?.(generatedStops);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startHHMM, dwellMin, segments, stopsOrdered.map((s) => s.stationId).join("|")]);

  // cascade edit: edit a departure and recalc forward
  function editDeparture(rowIdx, newHHMM) {
    const newMin = minutesFromHHMM(newHHMM);
    if (newMin == null) return;
    if (!segments || segments.length !== stopsOrdered.length - 1) return;

    setRows((prev) => {
      const next = prev.map((x) => ({ ...x }));

      // update edited row departure
      next[rowIdx].departure = hhmmFromMinutes(newMin);

      // recompute forward from this departure
      let depCursor = newMin;

      for (let i = rowIdx + 1; i < stopsOrdered.length; i++) {
        const seg = segments[i - 1];
        const arr = depCursor + (seg?.durationMin || 0);
        const isLast = i === stopsOrdered.length - 1;

        next[i].arrival = hhmmFromMinutes(arr);

        if (isLast) {
          // ✅ backend needs departureTime for last stop
          next[i].departure = hhmmFromMinutes(arr);
          depCursor = arr;
        } else {
          const dep2 = arr + (Number(dwellMin) || 0);
          next[i].departure = hhmmFromMinutes(dep2);
          depCursor = dep2;
        }
      }

      // emit generated stop times after updating rows
      const generatedStops = stopsOrdered.map((s, idx) => {
        const arrival = next[idx]?.arrival || "";
        let departure = next[idx]?.departure || "";

        if (idx === stopsOrdered.length - 1) {
          departure = departure || arrival;
        }

        return {
          stationId: s.stationId,
          order: s.order,
          arrivalTime: arrival,
          departureTime: departure,
        };
      });

      onGeneratedTimesChange?.(generatedStops);

      return next;
    });
  }

  return (
    <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 10 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Timetable Builder</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label>
            Start Time at A
            <input
              type="time"
              value={startHHMM}
              onChange={(e) => setStartHHMM(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            />
          </label>

          <label>
            Dwell/Stop Minutes
            <input
              type="number"
              min={0}
              value={dwellMin}
              onChange={(e) => setDwellMin(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
          Edit any departure time → system recalculates forward automatically.
        </div>
      </div>

      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 10 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.6fr 0.6fr",
            gap: 8,
            fontWeight: 900,
            opacity: 0.8,
          }}
        >
          <div>Station</div>
          <div>Arrival</div>
          <div>Departure (editable)</div>
        </div>

        {rows.map((r, idx) => (
          <div
            key={r.idx}
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.6fr 0.6fr",
              gap: 8,
              padding: 8,
              border: "1px solid #f0f0f0",
              borderRadius: 10,
              marginTop: 6,
            }}
          >
            <div style={{ fontWeight: 800 }}>
              {idx + 1}. {r.name}
            </div>

            <div>{idx === 0 ? <span style={{ opacity: 0.6 }}>—</span> : r.arrival}</div>

            <div>
              {idx === rows.length - 1 ? (
                // UI can still show "—" for last departure, but backend receives it (departure=arrival)
                <span style={{ opacity: 0.6 }}>—</span>
              ) : (
                <input
                  type="time"
                  value={r.departure}
                  onChange={(e) => editDeparture(idx, e.target.value)}
                  style={{ width: "100%", padding: 6 }}
                />
              )}
            </div>
          </div>
        ))}

        {rows.length === 0 && <div style={{ opacity: 0.75, marginTop: 8 }}>Build a route first.</div>}
      </div>
    </div>
  );
}
