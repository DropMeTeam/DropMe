import { getLatLng, haversineKm } from "./geo";

// -----------------------------
// OSRM (road) for distance/time
// -----------------------------
export async function osrmRoute(a, b) {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM failed: ${res.status}`);
  const data = await res.json();
  const r = data?.routes?.[0];
  if (!r) throw new Error("OSRM no route");
  return {
    distanceKm: (r.distance || 0) / 1000,
    durationMin: (r.duration || 0) / 60,
    polyline: (r.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]),
    source: "osrm",
  };
}

// -----------------------------
// Overpass (rail geometry) for polyline
// Build a railway graph and shortest-path on rails between A and B
// -----------------------------

function bboxAround(a, b, pad = 0.03) {
  // pad ~ 0.03 deg ~ ~3km-ish (varies). Adjust if needed.
  const south = Math.min(a.lat, b.lat) - pad;
  const west = Math.min(a.lng, b.lng) - pad;
  const north = Math.max(a.lat, b.lat) + pad;
  const east = Math.max(a.lng, b.lng) + pad;
  return { south, west, north, east };
}

async function overpassRailData(bbox) {
  const { south, west, north, east } = bbox;

  // Railway types you want to allow
  // rail / subway / light_rail / narrow_gauge can be included depending on your data
  const q = `
[out:json][timeout:25];
(
  way["railway"~"rail|subway|light_rail|narrow_gauge"](${south},${west},${north},${east});
);
(._;>;);
out body;
`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: q,
  });

  if (!res.ok) throw new Error(`Overpass failed: ${res.status}`);
  return res.json();
}

function buildGraphFromOverpass(json) {
  // nodes: id -> {lat,lng}
  const nodes = new Map();
  // adjacency: id -> [{to, w}]
  const adj = new Map();

  for (const el of json.elements || []) {
    if (el.type === "node") {
      nodes.set(el.id, { lat: el.lat, lng: el.lon });
    }
  }

  const addEdge = (u, v) => {
    const a = nodes.get(u);
    const b = nodes.get(v);
    if (!a || !b) return;
    const w = haversineKm(a.lat, a.lng, b.lat, b.lng);
    if (!adj.has(u)) adj.set(u, []);
    if (!adj.has(v)) adj.set(v, []);
    adj.get(u).push({ to: v, w });
    adj.get(v).push({ to: u, w });
  };

  for (const el of json.elements || []) {
    if (el.type === "way" && Array.isArray(el.nodes)) {
      for (let i = 0; i < el.nodes.length - 1; i++) {
        addEdge(el.nodes[i], el.nodes[i + 1]);
      }
    }
  }

  return { nodes, adj };
}

function nearestNodeId(nodes, point) {
  let bestId = null;
  let bestD = Infinity;
  for (const [id, n] of nodes.entries()) {
    const d = haversineKm(point.lat, point.lng, n.lat, n.lng);
    if (d < bestD) {
      bestD = d;
      bestId = id;
    }
  }
  return bestId;
}

function dijkstraPath(adj, start, goal) {
  // Simple Dijkstra (sufficient for small corridor graphs)
  const dist = new Map();
  const prev = new Map();
  const visited = new Set();

  dist.set(start, 0);

  // poor-man priority queue
  const pq = [{ id: start, d: 0 }];

  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const cur = pq.shift();
    if (!cur) break;

    const u = cur.id;
    if (visited.has(u)) continue;
    visited.add(u);

    if (u === goal) break;

    const edges = adj.get(u) || [];
    for (const e of edges) {
      const v = e.to;
      const nd = (dist.get(u) || Infinity) + e.w;
      if (nd < (dist.get(v) || Infinity)) {
        dist.set(v, nd);
        prev.set(v, u);
        pq.push({ id: v, d: nd });
      }
    }
  }

  if (!dist.has(goal)) return null;

  const path = [];
  let cur = goal;
  while (cur != null) {
    path.push(cur);
    cur = prev.get(cur) ?? null;
  }
  path.reverse();
  return path;
}

async function railPolylineBetween(a, b) {
  const bbox = bboxAround(a, b, 0.03);
  const data = await overpassRailData(bbox);
  const { nodes, adj } = buildGraphFromOverpass(data);

  if (nodes.size < 10) throw new Error("Rail graph too small in bbox");

  const startNode = nearestNodeId(nodes, a);
  const endNode = nearestNodeId(nodes, b);
  if (!startNode || !endNode) throw new Error("No rail nodes near stations");

  const pathIds = dijkstraPath(adj, startNode, endNode);
  if (!pathIds || pathIds.length < 2) throw new Error("No rail path found");

  const line = pathIds.map((id) => {
    const n = nodes.get(id);
    return [n.lat, n.lng];
  });

  return line;
}

// -----------------------------
// Main computeSegments
// -----------------------------
export async function computeSegments(stationsInOrder) {
  if (!stationsInOrder || stationsInOrder.length < 2) {
    return { segments: [], totalKm: 0, totalMin: 0, polyline: [] };
  }

  const segments = [];
  const polyline = [];
  let totalKm = 0;
  let totalMin = 0;

  for (let i = 0; i < stationsInOrder.length - 1; i++) {
    const A = stationsInOrder[i];
    const B = stationsInOrder[i + 1];

    const a = getLatLng(A);
    const b = getLatLng(B);
    if (!a || !b) continue;

    // 1) distance/time (OSRM preferred, fallback to haversine)
    let distKm, durMin, metricsSource, roadLine;

    try {
      const r = await osrmRoute(a, b);
      distKm = r.distanceKm;
      durMin = r.durationMin;
      metricsSource = "osrm";
      roadLine = r.polyline;
    } catch {
      distKm = haversineKm(a.lat, a.lng, b.lat, b.lng);
      const avgSpeedKmh = 45;
      durMin = (distKm / avgSpeedKmh) * 60;
      metricsSource = "fallback";
      roadLine = [[a.lat, a.lng], [b.lat, b.lng]];
    }

    // 2) polyline (RAIL preferred)
    let railLine = null;
    try {
      railLine = await railPolylineBetween(a, b);
    } catch {
      railLine = roadLine; // fallback
    }

    segments.push({
      fromId: String(A._id),
      toId: String(B._id),
      distanceKm: Math.round(distKm * 1000) / 1000,
      durationMin: Math.round(durMin),
      source: metricsSource,
      lineSource: railLine === roadLine ? "road-fallback" : "rail",
    });

    totalKm += distKm;
    totalMin += durMin;

    // stitch polylines without duplicate points
    if (railLine?.length) {
      if (polyline.length) polyline.push(...railLine.slice(1));
      else polyline.push(...railLine);
    }
  }

  return {
    segments,
    totalKm: Math.round(totalKm * 1000) / 1000,
    totalMin: Math.round(totalMin),
    polyline,
  };
}
