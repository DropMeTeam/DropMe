export async function getRoadRoute(points) {
    // points: [{lat,lng}, ...]
    if (!points || points.length < 2) return null;
  
    const coords = points.map(p => `${p.lng},${p.lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  
    const res = await fetch(url);
    if (!res.ok) throw new Error("OSRM route fetch failed");
    const data = await res.json();
  
    const route = data?.routes?.[0];
    if (!route?.geometry?.coordinates) return null;
  
    // OSRM geojson coordinates are [lng, lat] — convert for Leaflet [lat,lng]
    const latlngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  
    return {
      latlngs,
      distanceMeters: route.distance,
      durationSeconds: route.duration
    };
  }
  