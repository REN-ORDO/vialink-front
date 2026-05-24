import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';

// Forzamos hasGooglePlacesKey=true para estos tests (el setupTests global
// lo deja en false). Re-importamos el módulo limpio acá adentro para no
// chocar con el mock global.
vi.unmock('./googlePlaces');

// La key se lee a module-init, así que stubeamos el env ANTES de importar.
vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'TEST_FAKE_KEY');

import {
  autocompletePlaces,
  getPlaceDetails,
  hasGooglePlacesKey,
  newSessionToken,
} from './googlePlaces';

describe('googlePlaces', () => {
  type FetchSpy = MockInstance<
    (
      input: RequestInfo | URL,
      init?: RequestInit | undefined,
    ) => Promise<Response>
  >;
  let fetchSpy: FetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as FetchSpy;
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('hasGooglePlacesKey true cuando la env está set', () => {
    expect(hasGooglePlacesKey()).toBe(true);
  });

  it('newSessionToken devuelve un string único', () => {
    const a = newSessionToken();
    const b = newSessionToken();
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a).not.toBe(b);
  });

  it('autocompletePlaces POSTea a places:autocomplete con sessionToken y devuelve predicciones', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          suggestions: [
            {
              placePrediction: {
                placeId: 'ChIJ_uninorte',
                text: { text: 'Universidad del Norte, Puerto Colombia' },
                structuredFormat: {
                  mainText: { text: 'Universidad del Norte' },
                  secondaryText: { text: 'Puerto Colombia' },
                },
                types: ['university'],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const out = await autocompletePlaces('uninorte', {
      sessionToken: 'tkn-1',
      proximity: { lat: 11.0186, lng: -74.8499 },
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe(
      'https://places.googleapis.com/v1/places:autocomplete',
    );
    expect(init?.method).toBe('POST');
    const body = JSON.parse(init!.body as string);
    expect(body.input).toBe('uninorte');
    expect(body.sessionToken).toBe('tkn-1');
    expect(body.languageCode).toBe('es');
    expect(body.regionCode).toBe('CO');
    expect(body.includedRegionCodes).toEqual(['co']);
    expect(body.locationBias.circle.center).toEqual({
      latitude: 11.0186,
      longitude: -74.8499,
    });

    expect(out).toEqual([
      {
        id: 'ChIJ_uninorte',
        placeId: 'ChIJ_uninorte',
        label: 'Universidad del Norte',
        fullAddress: 'Universidad del Norte, Puerto Colombia',
        category: 'university',
      },
    ]);
  });

  it('autocompletePlaces devuelve [] para query vacío sin pegarle a la red', async () => {
    const out = await autocompletePlaces('  ', { sessionToken: 'x' });
    expect(out).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('autocompletePlaces tira error con info útil si la respuesta no es OK', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('REQUEST_DENIED', { status: 403 }),
    );
    await expect(
      autocompletePlaces('uninorte', { sessionToken: 't' }),
    ).rejects.toThrow(/403/);
  });

  it('getPlaceDetails GET con FieldMask y devuelve GeocodeSuggestion', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'ChIJ_uninorte',
          displayName: { text: 'Universidad del Norte' },
          formattedAddress: 'Km 5 Vía Puerto Colombia, Atlántico, Colombia',
          location: { latitude: 11.0186, longitude: -74.8499 },
          types: ['university', 'point_of_interest'],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const out = await getPlaceDetails('ChIJ_uninorte', {
      sessionToken: 'tkn-1',
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain(
      'https://places.googleapis.com/v1/places/ChIJ_uninorte?',
    );
    expect(String(url)).toContain('sessionToken=tkn-1');
    expect(String(url)).toContain('languageCode=es');
    expect(String(url)).toContain('regionCode=CO');
    const headers = init?.headers as Record<string, string>;
    expect(headers['X-Goog-Api-Key']).toMatch(/^.+/); // some non-empty key
    expect(headers['X-Goog-FieldMask']).toContain('location');
    expect(headers['X-Goog-FieldMask']).toContain('formattedAddress');

    expect(out).toEqual({
      id: 'ChIJ_uninorte',
      label: 'Universidad del Norte',
      fullAddress: 'Km 5 Vía Puerto Colombia, Atlántico, Colombia',
      location: { lat: 11.0186, lng: -74.8499 },
      category: 'university',
    });
  });
});
