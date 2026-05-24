/**
 * Google Places API (NEW) client — endpoints REST directos.
 *
 * Por qué REST (y no la JS SDK):
 *   - El JS SDK requiere bootstrap del Maps JavaScript API (300+ KB de JS).
 *   - Para autocompletar direcciones no necesitamos el mapa de Google.
 *   - La New Places API soporta CORS desde el browser, así que fetch funciona.
 *
 * Patrón de billing óptimo: **session tokens**.
 *   Una "sesión" de búsqueda = muchas llamadas de Autocomplete + 1 sola
 *   llamada de Place Details. Si todas usan el mismo sessionToken, Google
 *   las bundlea y cobra solo el Autocomplete (~$0.003 por sesión completa).
 *   Sin token, autocompletar 5 veces + 1 detalle costaría ~$0.018.
 *
 * Después del Place Details la sesión se cierra; hay que generar un nuevo
 * token para la siguiente búsqueda.
 *
 * Docs: https://developers.google.com/maps/documentation/places/web-service/op-overview
 */

import type { LatLng, PlacePrediction, GeocodeSuggestion } from '../types';

const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
const KEY = env.VITE_GOOGLE_MAPS_API_KEY ?? '';
const BASE = 'https://places.googleapis.com/v1';

// Sesgo a Colombia para todas las búsquedas (la app es Barranquilla-only).
const LANGUAGE_CODE = 'es';
const REGION_CODE = 'CO';

export function hasGooglePlacesKey(): boolean {
  return KEY.length > 0;
}

/**
 * Genera un sessionToken nuevo. Usar el MISMO token para todas las
 * llamadas autocomplete + el detalle final de UNA sesión de búsqueda.
 * Después de Place Details, rotar el token.
 */
export function newSessionToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback no-crypto (jsdom viejo, etc).
  return `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ============================================================
// Autocomplete (NEW)
// POST https://places.googleapis.com/v1/places:autocomplete
// ============================================================

interface AutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId: string;
      text?: { text: string };
      structuredFormat?: {
        mainText?: { text: string };
        secondaryText?: { text: string };
      };
      types?: string[];
    };
  }>;
}

export async function autocompletePlaces(
  input: string,
  opts: {
    sessionToken: string;
    proximity?: LatLng;
    /** Radio de sesgo en metros (default 50 km alrededor de proximity). */
    biasRadiusM?: number;
  },
): Promise<PlacePrediction[]> {
  if (!KEY) throw new Error('VITE_GOOGLE_MAPS_API_KEY no configurada');
  if (!input.trim()) return [];

  const body: Record<string, unknown> = {
    input,
    sessionToken: opts.sessionToken,
    languageCode: LANGUAGE_CODE,
    regionCode: REGION_CODE,
    includedRegionCodes: ['co'],
  };

  if (opts.proximity) {
    body.locationBias = {
      circle: {
        center: {
          latitude: opts.proximity.lat,
          longitude: opts.proximity.lng,
        },
        radius: opts.biasRadiusM ?? 50_000,
      },
    };
  }

  const res = await fetch(`${BASE}/places:autocomplete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Places autocomplete ${res.status}: ${text.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as AutocompleteResponse;
  const suggestions = data.suggestions ?? [];

  return suggestions
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({
      id: p.placeId,
      placeId: p.placeId,
      label:
        p.structuredFormat?.mainText?.text ?? p.text?.text ?? '(sin nombre)',
      fullAddress: p.text?.text ?? '',
      category: p.types?.[0] ?? null,
    }));
}

// ============================================================
// Place Details (NEW)
// GET https://places.googleapis.com/v1/places/{placeId}
// ============================================================

interface PlaceDetailsResponse {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  types?: string[];
}

const DETAILS_FIELD_MASK =
  'id,displayName,formattedAddress,location,types';

export async function getPlaceDetails(
  placeId: string,
  opts: { sessionToken?: string } = {},
): Promise<GeocodeSuggestion> {
  if (!KEY) throw new Error('VITE_GOOGLE_MAPS_API_KEY no configurada');

  const params = new URLSearchParams();
  params.set('languageCode', LANGUAGE_CODE);
  params.set('regionCode', REGION_CODE);
  if (opts.sessionToken) params.set('sessionToken', opts.sessionToken);

  const res = await fetch(
    `${BASE}/places/${encodeURIComponent(placeId)}?${params.toString()}`,
    {
      headers: {
        'X-Goog-Api-Key': KEY,
        // FieldMask es obligatorio en NEW Places API.
        'X-Goog-FieldMask': DETAILS_FIELD_MASK,
      },
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Place details ${res.status}: ${text.slice(0, 200)}`,
    );
  }

  const place = (await res.json()) as PlaceDetailsResponse;
  if (!place.location) {
    throw new Error(`Place ${placeId} no tiene location`);
  }

  return {
    id: place.id,
    label:
      place.displayName?.text ??
      place.formattedAddress?.split(',')[0]?.trim() ??
      '(sin nombre)',
    fullAddress: place.formattedAddress ?? '',
    location: {
      lat: place.location.latitude,
      lng: place.location.longitude,
    },
    category: place.types?.[0] ?? null,
  };
}
