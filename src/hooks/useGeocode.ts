import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { dataSource } from '../lib/dataSource';
import { newSessionToken } from '../lib/googlePlaces';
import type { LatLng } from '../types';

function useDebounced<T>(value: T, ms = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * Autocomplete de direcciones con session token integrado.
 *
 * Devuelve predicciones (label + fullAddress + placeId | location). El
 * caller decide cuándo resolver lat/lng usando `dataSource.resolvePlace`
 * y debe pasarle `sessionToken` para que Google bundlee el billing.
 *
 * `rotateSessionToken()` debe llamarse DESPUÉS de resolver una predicción
 * (es el equivalente a cerrar la sesión de búsqueda y abrir una nueva).
 */
export function useGeocode(query: string, proximity?: LatLng) {
  const debouncedQuery = useDebounced(query, 350);
  const enabled = debouncedQuery.trim().length >= 3;

  // Session token persiste a lo largo de toda la sesión de búsqueda
  // (múltiples autocompletes + 1 details). Solo cambia cuando el caller
  // llama rotateSessionToken() tras resolver.
  const sessionTokenRef = useRef<string>(newSessionToken());

  const rotateSessionToken = useCallback(() => {
    sessionTokenRef.current = newSessionToken();
  }, []);

  const queryResult = useQuery({
    queryKey: [
      'places-autocomplete',
      debouncedQuery,
      proximity?.lat,
      proximity?.lng,
    ],
    queryFn: () =>
      dataSource.searchPlaces(debouncedQuery, {
        proximity,
        sessionToken: sessionTokenRef.current,
        limit: 5,
      }),
    enabled,
    staleTime: 60 * 60_000,
    gcTime: 60 * 60_000,
  });

  // No exponemos sessionTokenRef.current directamente porque eso es
  // "leer un ref durante el render" (impure). En su lugar, exponemos un
  // getter que el caller invoca dentro de un event handler (post-render).
  const getSessionToken = useCallback(() => sessionTokenRef.current, []);

  return {
    ...queryResult,
    getSessionToken,
    rotateSessionToken,
  };
}
