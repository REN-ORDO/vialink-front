import { http, HttpResponse } from 'msw';
import { API_BASE } from './api';
import { busesMock } from './mockData';
import type {
  BackendBusDetailsResponse,
  BackendBusListResponse,
  BackendBusesAtPointResponse,
  BackendGeocodeResponse,
  BackendLandmarkNearbyResponse,
  BackendRouteRecommendResponse,
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
    HttpResponse.json<BackendLandmarkNearbyResponse>({
      landmarks: [
        {
          id: 'lm-1',
          name: 'Buenavista',
          type: 'MALL',
          address: 'Cra. 53 con Cl. 100',
          location: { lat: 11.0046, lng: -74.8083 },
          distance_m: 250,
          routes_passing_count: 3,
        },
        {
          id: 'lm-2',
          name: 'Plaza de la Paz',
          type: 'SQUARE',
          address: 'Cra. 46 con Cl. 53',
          location: { lat: 10.9842, lng: -74.7903 },
          distance_m: 800,
          routes_passing_count: 2,
        },
      ],
    }),
  ),

  http.get(`${BASE}/buses`, ({ request }) => {
    const url = new URL(request.url);
    const city = url.searchParams.get('city') ?? 'BAQ';
    return HttpResponse.json<BackendBusListResponse>({
      city,
      count: busesMock.length,
      buses: busesMock.map((b) => ({
        id: b.id,
        plate: `MOCK-${b.id.toUpperCase()}`,
        route_id: `r-mock-${b.id}`,
        route_code: b.rutaNombre,
        location: { lat: b.lat, lng: b.lng },
        heading: b.heading,
        speed_kmh: 22,
        fraction_of_corridor: 0.3,
        status: 'IN_SERVICE',
        last_seen_at: '2026-05-23T20:00:00Z',
      })),
    });
  }),

  http.get(`${BASE}/buses/:id/details`, ({ params, request }) => {
    const url = new URL(request.url);
    const hasUser =
      url.searchParams.has('lat') && url.searchParams.has('lng');
    const busId = String(params.id);
    if (busId === '550e8400-e29b-41d4-a716-446655440404') {
      return HttpResponse.json(
        { statusCode: 404, message: 'Bus no encontrado', error: 'Not Found' },
        { status: 404 },
      );
    }
    if (busId === '550e8400-e29b-41d4-a716-446655440410') {
      return HttpResponse.json(
        { statusCode: 410, message: 'Bus completo su recorrido', error: 'Gone' },
        { status: 410 },
      );
    }
    return HttpResponse.json<BackendBusDetailsResponse>({
      bus: {
        id: busId,
        plate: 'URD123',
        location: { lat: 11.012, lng: -74.812 },
        heading: 245,
        speed_kmh: 28,
        fraction_of_corridor: 0.34,
        status: 'IN_SERVICE',
        last_seen_at: '2026-05-23T20:34:13Z',
      },
      route: {
        id: 'route-c12',
        code: 'C12',
        name: 'Centro - Uninorte',
        color: '#1E5EFF',
        mode: 'TRADITIONAL',
        operator: 'Coochofal',
        length_km: 17.65,
      },
      polyline: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [-74.78, 10.96],
            [-74.79, 10.97],
            [-74.812, 11.012],
          ],
        },
        properties: {
          route_id: 'route-c12',
          code: 'C12',
          color: '#1E5EFF',
        },
      },
      next_landmark: {
        id: 'lm-uninorte',
        name: 'Universidad del Norte',
        type: 'UNIVERSITY',
        location: { lat: 11.018, lng: -74.851 },
        eta_seconds: 240,
        distance_m: 1200,
      },
      eta_to_user: hasUser
        ? {
            eta_seconds: 320,
            distance_m: 1500,
            nearest_corridor_point: { lat: 11.015, lng: -74.849 },
          }
        : null,
      stats: {
        completed_km: 6.0,
        completed_pct: 0.34,
        remaining_km: 11.65,
      },
    });
  }),

  http.post(`${BASE}/routing/recommend`, async ({ request }) => {
    const body = (await request.json()) as {
      user_location: { lat: number; lng: number };
      destination: { lat: number; lng: number };
    };
    return HttpResponse.json<BackendRouteRecommendResponse>({
      user_location: body.user_location,
      destination: body.destination,
      generated_at: new Date().toISOString(),
      recommendations: [
        {
          rank: 1,
          total_minutes: 19,
          walking_to_board: {
            paradero: {
              id: 'lm-1',
              name: 'Universidad del Norte',
              lat: 11.0186,
              lng: -74.8499,
            },
            distance_m: 0,
            blocks: 1,
            duration_minutes: 1,
          },
          bus: {
            id: 'mock-bus-rec',
            plate: 'GMP134',
            route_id: 'r-mock-1',
            route_code: 'S12',
            route_name: 'Sabanilla - Centro',
            route_color: '#A855F7',
            wait_minutes: 8,
            ride_minutes: 10,
          },
          walking_from_alight: {
            paradero: {
              id: 'lm-2',
              name: 'Clínica Iberoamérica',
              lat: 11.0048,
              lng: -74.809,
            },
            distance_m: 80,
            blocks: 1,
            duration_minutes: 1,
          },
          polyline_bus: [
            { lat: 11.0186, lng: -74.8499 },
            { lat: 11.0048, lng: -74.809 },
          ],
        },
      ],
    });
  }),

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
