import { http, HttpResponse } from 'msw';
import { API_BASE } from './api';
import type {
  BackendBusesAtPointResponse,
  BackendGeocodeResponse,
  BackendLandmarkNearbyResponse,
} from '../types/backend';

const BASE = API_BASE;

export const handlers = [
  http.get(`${BASE}/health`, () => HttpResponse.json({ ok: true })),

  http.get(`${BASE}/geocode`, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') ?? '';
    return HttpResponse.json<BackendGeocodeResponse>({
      query: q,
      results: [
        {
          formatted_address: `${q}, Barranquilla, Atlántico, Colombia`,
          location: { lat: 11.018, lng: -74.85 },
          category: 'address',
          relevance: 0.9,
          source: 'mapbox',
        },
      ],
      cached: false,
      latency_ms: 50,
    });
  }),

  http.get(`${BASE}/landmarks/nearby`, () =>
    HttpResponse.json<BackendLandmarkNearbyResponse>({ landmarks: [] }),
  ),

  http.post(`${BASE}/buses-at-point`, async ({ request }) => {
    const body = (await request.json()) as { location: { lat: number; lng: number } };
    return HttpResponse.json<BackendBusesAtPointResponse>({
      location: body.location,
      routes: [
        {
          route: {
            id: 'r-mock',
            code: 'C12',
            name: 'Centro - Norte',
            color: '#1E5EFF',
            mode: 'TRADITIONAL',
            operator: 'Bus Azul',
          },
          distance_to_corridor_m: 18,
          status: 'OPERATING',
          next_buses: [
            {
              bus_id: 'b-mock',
              plate: 'ABC123',
              eta_seconds: 240,
              distance_m: 320,
              current_location: { lat: body.location.lat, lng: body.location.lng },
            },
          ],
        },
      ],
    });
  }),
];

export { BASE };
