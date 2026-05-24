/**
 * Constantes para Google Places integration.
 *
 * Centralizadas acá para que el bias geográfico + país + libraries
 * sean fáciles de cambiar al portar la app a otra ciudad.
 */

/** Centro por defecto cuando el user no comparte ubicación. Barranquilla, COL. */
export const DEFAULT_CITY_CENTER = { lat: 10.9685, lng: -74.7813 } as const;

/** Código ISO 3166-1 Alpha-2 — restringe búsquedas a este país. */
export const DEFAULT_COUNTRY_CODE = 'co';

/** Radio del location bias en metros — cubre área metropolitana. */
export const DEFAULT_BIAS_RADIUS_M = 50_000;

/**
 * Libraries a cargar del Maps JS SDK.
 *
 * IMPORTANTE: debe ser una constante de módulo (no inline en el componente)
 * porque @react-google-maps/api hace shallow comparison del array — si la
 * referencia cambia en cada render, re-monta el SDK y todo se rompe.
 */
export const GOOGLE_MAPS_LIBRARIES: ('places' | 'geocoding')[] = [
  'places',
  'geocoding',
];

/** API key desde env. .env.local debe tener VITE_GOOGLE_MAPS_API_KEY. */
export const GOOGLE_MAPS_API_KEY: string =
  (import.meta as ImportMeta & { env: Record<string, string | undefined> })
    .env.VITE_GOOGLE_MAPS_API_KEY ?? '';
