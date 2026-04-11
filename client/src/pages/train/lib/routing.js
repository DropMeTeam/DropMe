import { getLatLng, haversineKm } from "./geo";

// -----------------------------
// Helpers
// -----------------------------
function round3(value) {
  return Math.round(Number(value || 0) * 1000) / 1000;
}

function toLatLngPair(point) {
  return [Number(point.lat), Number(point.lng)];
}

function normalizeRailPath(points = []) {
  const normalized = [];

  for (const point of points) {
    const lat = Number(point?.lat);
    const lng = Number(point?.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const prev = normalized[normalized.length - 1];
    if (!prev || prev.lat !== lat || prev.lng !== lng) {
      normalized.push({ lat, lng });
    }
  }

  return normalized;
}

function stitchPolylineFromSegments(segments = []) {
  const polyline = [];

  for (const segment of segments) {
    const line = Array.isArray(segment?.railPath) ? segment.railPath : [];
    if (!line.length) continue;

    const asPairs = line.map(toLatLngPair);

    if (polyline.length === 0) {
      polyline.push(...asPairs);
      continue;
    }

    const [firstLat, firstLng] = asPairs[0];
    const [prevLat, prevLng] = polyline[polyline.length - 1];

    if (prevLat === firstLat && prevLng === firstLng) {
      polyline.push(...asPairs.slice(1));
    } else {
      polyline.push(...asPairs);
    }
  }

  return polyline;
}

// -----------------------------
// OSRM (road) for distance/time
// -----------------------------
export async function osrmRoute(a, b) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM failed: ${res.status}`);

  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route) throw new Error("OSRM no route");

  return {
    distanceKm: Number(route.distance || 0) / 1000,
    durationMin: Number(route.duration || 0) / 60,
    polyline: Array.isArray(route?.geometry?.coordinates)
      ? route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))
      : [],
    source: "osrm",
  };
}

// -----------------------------
// Overpass (rail geometry) for polyline
// Build a railway graph and shortest-path on rails between A and B
// -----------------------------
function bboxAround(a, b, pad = 0.03) {
  return {
    south: Math.min(a.lat, b.lat) - pad,
    west: Math.min(a.lng, b.lng) - pad,
    north: Math.max(a.lat, b.lat) + pad,
    east: Math.max(a.lng, b.lng) + pad,
  };
}

async function overpassRailData(bbox) {
  const { south, west, north, east } = bbox;

  const query = `
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
    body: query,
  });

  if (!res.ok) {
    throw new Error(`Overpass failed: ${res.status}`);
  }

  return res.json();
}

function buildGraphFromOverpass(json) {
  const nodes = new Map();
  const adj = new Map();

  for (const el of json?.elements || []) {
    if (el.type === "node") {
      nodes.set(el.id, { lat: el.lat, lng: el.lon });
    }
  }

  const addEdge = (u, v) => {
    const a = nodes.get(u);
    const b = nodes.get(v);
    if (!a || !b) return;

    const weight = haversineKm(a.lat, a.lng, b.lat, b.lng);

    if (!adj.has(u)) adj.set(u, []);
    if (!adj.has(v)) adj.set(v, []);

    adj.get(u).push({ to: v, w: weight });
    adj.get(v).push({ to: u, w: weight });
  };

  for (const el of json?.elements || []) {
    if (el.type === "way" && Array.isArray(el.nodes)) {
      for (let i = 0; i < el.nodes.length - 1; i += 1) {
        addEdge(el.nodes[i], el.nodes[i + 1]);
      }
    }
  }

  return { nodes, adj };
}

function nearestNodeId(nodes, point) {
  let bestId = null;
  let bestDistance = Infinity;

  for (const [id, node] of nodes.entries()) {
    const d = haversineKm(point.lat, point.lng, node.lat, node.lng);
    if (d < bestDistance) {
      bestDistance = d;
      bestId = id;
    }
  }

  return bestId;
}

function dijkstraPath(adj, start, goal) {
  const dist = new Map();
  const prev = new Map();
  const visited = new Set();
  const pq = [{ id: start, d: 0 }];

  dist.set(start, 0);

  while (pq.length > 0) {
    pq.sort((a, b) => a.d - b.d);
    const current = pq.shift();
    if (!current) break;

    const u = current.id;
    if (visited.has(u)) continue;
    visited.add(u);

    if (u === goal) break;

    const edges = adj.get(u) || [];
    for (const edge of edges) {
      const nextDistance = (dist.get(u) || 0) + edge.w;

      if (nextDistance < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, nextDistance);
        prev.set(edge.to, u);
        pq.push({ id: edge.to, d: nextDistance });
      }
    }
  }

  if (!dist.has(goal)) return null;

  const path = [];
  let current = goal;

  while (current != null) {
    path.push(current);
    current = prev.get(current) ?? null;
  }

  path.reverse();
  return path;
}

async function railPolylineBetween(a, b) {
  const bbox = bboxAround(a, b, 0.03);
  const data = await overpassRailData(bbox);
  const { nodes, adj } = buildGraphFromOverpass(data);

  if (nodes.size < 2) {
    throw new Error("Rail graph too small in bbox");
  }

  const startNode = nearestNodeId(nodes, a);
  const endNode = nearestNodeId(nodes, b);

  if (!startNode || !endNode) {
    throw new Error("No rail nodes near stations");
  }

  const pathIds = dijkstraPath(adj, startNode, endNode);
  if (!pathIds || pathIds.length < 2) {
    throw new Error("No rail path found");
  }

  return pathIds
    .map((id) => nodes.get(id))
    .filter(Boolean)
    .map((node) => ({ lat: Number(node.lat), lng: Number(node.lng) }));
}

// -----------------------------
// Main computeSegments
// -----------------------------
export async function computeSegments(stationsInOrder) {
  if (!Array.isArray(stationsInOrder) || stationsInOrder.length < 2) {
    return {
      segments: [],
      totalKm: 0,
      totalMin: 0,
      polyline: [],
    };
  }

  const segments = [];
  let totalKm = 0;
  let totalMin = 0;

  for (let i = 0; i < stationsInOrder.length - 1; i += 1) {
    const fromStation = stationsInOrder[i];
    const toStation = stationsInOrder[i + 1];

    const a = getLatLng(fromStation);
    const b = getLatLng(toStation);

    if (!a || !b) continue;

    let distanceKm = haversineKm(a.lat, a.lng, b.lat, b.lng);
    let durationMin = (distanceKm / 45) * 60;
    let metricSource = "fallback";
    let fallbackRoadLine = [
      { lat: a.lat, lng: a.lng },
      { lat: b.lat, lng: b.lng },
    ];

    try {
      const road = await osrmRoute(a, b);
      distanceKm = road.distanceKm;
      durationMin = road.durationMin;
      metricSource = "osrm";
      if (road.polyline.length >= 2) {
        fallbackRoadLine = normalizeRailPath(road.polyline);
      }
    } catch {
      // keep fallback values
    }

    let railPath = [];
    let lineSource = "rail";

    try {
      railPath = normalizeRailPath(await railPolylineBetween(a, b));
      if (railPath.length < 2) {
        throw new Error("Rail path too short");
      }
    } catch {
      railPath = normalizeRailPath(fallbackRoadLine);
      lineSource = "road-fallback";
    }

    if (railPath.length < 2) {
      railPath = normalizeRailPath([
        { lat: a.lat, lng: a.lng },
        { lat: b.lat, lng: b.lng },
      ]);
      lineSource = "straight-fallback";
    }

    segments.push({
      fromId: String(fromStation?._id || ""),
      toId: String(toStation?._id || ""),
      fromStationId: String(fromStation?._id || ""),
      toStationId: String(toStation?._id || ""),
      distanceKm: round3(distanceKm),
      durationMin: Math.round(durationMin),
      source: metricSource,
      lineSource,
      railPath,
    });

    totalKm += Number(distanceKm || 0);
    totalMin += Number(durationMin || 0);
  }

  return {
    segments,
    totalKm: round3(totalKm),
    totalMin: Math.round(totalMin),
    polyline: stitchPolylineFromSegments(segments),
  };
}