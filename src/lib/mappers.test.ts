import { describe, expect, it } from 'vitest';
import {
  backendBusDetailsToBusDetails,
  backendGeocodeResultToSuggestion,
} from './mappers';
import type { BackendBusDetailsResponse } from '../types/backend';

const busDetailsFixture: BackendBusDetailsResponse = {
  bus: {
    id: 'bus-1',
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
    properties: { route_id: 'route-c12', code: 'C12', color: '#1E5EFF' },
  },
  next_landmark: {
    id: 'lm-uninorte',
    name: 'Universidad del Norte',
    type: 'UNIVERSITY',
    location: { lat: 11.018, lng: -74.851 },
    eta_seconds: 240,
    distance_m: 1200,
  },
  eta_to_user: {
    eta_seconds: 320,
    distance_m: 1500,
    nearest_corridor_point: { lat: 11.015, lng: -74.849 },
  },
  stats: {
    completed_km: 6.0,
    completed_pct: 0.34,
    remaining_km: 11.65,
  },
};

describe('backendGeocodeResultToSuggestion', () => {
  it('acorta el label a las primeras 2 partes de la direccion', () => {
    const s = backendGeocodeResultToSuggestion({
      formatted_address:
        'Calle 84 #50-12, Norte, Barranquilla, Atlántico, Colombia',
      location: { lat: 11, lng: -74 },
      category: 'address',
      relevance: 1,
      source: 'mapbox',
    });
    expect(s.label).toBe('Calle 84 #50-12, Norte');
    expect(s.location.lat).toBe(11);
    expect(s.fullAddress).toBe(
      'Calle 84 #50-12, Norte, Barranquilla, Atlántico, Colombia',
    );
    expect(s.category).toBe('address');
    expect(s.id).toHaveLength(16);
  });

  it('produce ids estables para la misma direccion', () => {
    const base = {
      formatted_address: 'Cra 50 #80-30, Riomar, Barranquilla',
      location: { lat: 11.02, lng: -74.82 },
      category: 'street' as const,
      relevance: 0.8,
      source: 'mapbox' as const,
    };
    expect(backendGeocodeResultToSuggestion(base).id).toBe(
      backendGeocodeResultToSuggestion(base).id,
    );
  });

  it('soporta direcciones de una sola parte', () => {
    const s = backendGeocodeResultToSuggestion({
      formatted_address: 'Buenavista',
      location: { lat: 11, lng: -74 },
      category: 'place',
      relevance: 0.5,
      source: 'cache',
    });
    expect(s.label).toBe('Buenavista');
  });
});

describe('backendBusDetailsToBusDetails', () => {
  it('mapea los campos basicos del bus', () => {
    const d = backendBusDetailsToBusDetails(busDetailsFixture);
    expect(d.id).toBe('bus-1');
    expect(d.plate).toBe('URD123');
    expect(d.speedKmh).toBe(28);
    expect(d.heading).toBe(245);
    expect(d.status).toBe('IN_SERVICE');
  });

  it('mapea la ruta con length_km', () => {
    const d = backendBusDetailsToBusDetails(busDetailsFixture);
    expect(d.route.code).toBe('C12');
    expect(d.route.lengthKm).toBe(17.65);
    expect(d.route.color).toBe('#1E5EFF');
    expect(d.route.operator).toBe('Coochofal');
  });

  it('convierte polyline GeoJSON [lng,lat] a LatLng[] para Leaflet', () => {
    const d = backendBusDetailsToBusDetails(busDetailsFixture);
    expect(d.polyline).toHaveLength(3);
    expect(d.polyline[0]).toEqual({ lat: 10.96, lng: -74.78 });
    expect(d.polyline[2]).toEqual({ lat: 11.012, lng: -74.812 });
  });

  it('mapea next_landmark cuando esta presente', () => {
    const d = backendBusDetailsToBusDetails(busDetailsFixture);
    expect(d.nextLandmark).not.toBeNull();
    expect(d.nextLandmark?.name).toBe('Universidad del Norte');
    expect(d.nextLandmark?.etaSeconds).toBe(240);
  });

  it('devuelve nextLandmark null cuando el bus esta al final', () => {
    const d = backendBusDetailsToBusDetails({
      ...busDetailsFixture,
      next_landmark: null,
    });
    expect(d.nextLandmark).toBeNull();
  });

  it('devuelve etaToUser null cuando no se paso ubicacion', () => {
    const d = backendBusDetailsToBusDetails({
      ...busDetailsFixture,
      eta_to_user: null,
    });
    expect(d.etaToUser).toBeNull();
  });

  it('default heading a 0 si backend devuelve null', () => {
    const d = backendBusDetailsToBusDetails({
      ...busDetailsFixture,
      bus: { ...busDetailsFixture.bus, heading: null },
    });
    expect(d.heading).toBe(0);
  });

  it('mapea stats', () => {
    const d = backendBusDetailsToBusDetails(busDetailsFixture);
    expect(d.stats.completedKm).toBe(6.0);
    expect(d.stats.completedPct).toBe(0.34);
    expect(d.stats.remainingKm).toBe(11.65);
  });
});
