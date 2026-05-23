export type LatLng = { lat: number; lng: number };

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

type OsrmResponse = {
  code: string;
  routes?: {
    geometry: { type: 'LineString'; coordinates: [number, number][] };
    duration: number;
    distance: number;
  }[];
};

const cache = new Map<string, LatLng[]>();

function keyFor(stops: LatLng[]): string {
  return stops.map((s) => `${s.lat.toFixed(5)},${s.lng.toFixed(5)}`).join('|');
}

export async function fetchRoute(stops: LatLng[]): Promise<LatLng[] | null> {
  if (stops.length < 2) return null;
  const key = keyFor(stops);
  const cached = cache.get(key);
  if (cached) return cached;

  const coords = stops.map((s) => `${s.lng},${s.lat}`).join(';');
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson&continue_straight=true`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: OsrmResponse = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    const path = data.routes[0].geometry.coordinates.map(
      ([lng, lat]) => ({ lat, lng }),
    );
    cache.set(key, path);
    return path;
  } catch {
    return null;
  }
}

export function densify(path: LatLng[], stepMeters = 25): LatLng[] {
  if (path.length < 2) return path;
  const out: LatLng[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const dLat = b.lat - a.lat;
    const dLng = b.lng - a.lng;
    const meters = Math.sqrt(dLat ** 2 + dLng ** 2) * 111_000;
    const steps = Math.max(1, Math.round(meters / stepMeters));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      out.push({ lat: a.lat + dLat * t, lng: a.lng + dLng * t });
    }
  }
  return out;
}
