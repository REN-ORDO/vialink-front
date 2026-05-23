import { http, HttpResponse } from 'msw';
import { API_BASE } from './api';
import type { BackendGeocodeResponse } from '../types/backend';

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
];

export { BASE };
