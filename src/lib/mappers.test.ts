import { describe, expect, it } from 'vitest';
import { backendGeocodeResultToSuggestion } from './mappers';

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
