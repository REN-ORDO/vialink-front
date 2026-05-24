import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_BIAS_RADIUS_M, DEFAULT_COUNTRY_CODE } from '../config/places';

/**
 * Hook para autocomplete de lugares con el JS SDK de Google Maps Places
 * (la API "legacy" — google.maps.places.AutocompleteService).
 *
 * Por qué legacy y no la NEW (REST):
 *   - El SDK maneja sessionTokens automáticamente — 1 token agrupa N
 *     autocompletes + 1 details, factura como 1 sesión (~$0.003 vs
 *     ~$0.018 sin token).
 *   - Tiene location bias + radio nativo (NEW lo soporta pero con sintaxis
 *     más verbosa).
 *   - structured_formatting devuelve main_text + secondary_text ya
 *     parseados, mejor UX que parsear "description" a mano.
 *   - El SDK ya está cargado para Geocoding/Maps así que no agrega peso.
 *
 * Flujo:
 *   1. user escribe → debounce 300ms → AutocompleteService.getPlacePredictions
 *   2. user pica una predicción → getPlaceDetails (placeId) → lat/lng/address
 *   3. tras getDetails, rotamos el sessionToken (la sesión se cerró)
 *
 * Patrón de billing: 1 sessionToken para toda la sesión de búsqueda.
 * Lo regenera tras cada getPlaceDetails.
 */

export type PlacePrediction = {
  placeId: string;
  /** Nombre del negocio/POI ("Mall Plaza El Castillo"). */
  mainText: string;
  /** Dirección o zona ("Carrera 53, Barranquilla"). */
  secondaryText: string;
  /** Texto completo combinado para fallback display. */
  description: string;
};

export type PlaceDetails = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type Options = {
  /** Mínimo de caracteres para disparar la búsqueda. Default 3. */
  minChars?: number;
  /** Delay del debounce en ms. Default 300. */
  debounceMs?: number;
  /** Cap de predicciones a devolver. Google devuelve hasta 5. Default 5. */
  maxResults?: number;
  /** Ubicación del user para sesgar resultados geográficamente. */
  userLocation?: { lat: number; lng: number } | null;
  /** Código ISO 3166-1 Alpha-2. Default "co". */
  country?: string;
  /** Flag: true cuando el SDK ya cargó (useJsApiLoader.isLoaded). */
  isLoaded?: boolean;
};

const ERROR_MESSAGE =
  'No se pudo buscar lugares. Intenta marcar manualmente en el mapa.';

export function usePlacesAutocomplete({
  minChars = 3,
  debounceMs = 300,
  maxResults = 5,
  userLocation,
  country = DEFAULT_COUNTRY_CODE,
  isLoaded = false,
}: Options = {}) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs para los servicios del SDK — los creamos una vez y reusamos.
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inicialización cuando el SDK está listo.
  useEffect(() => {
    if (
      !isLoaded ||
      typeof google === 'undefined' ||
      !google.maps?.places
    ) {
      return;
    }

    autocompleteServiceRef.current =
      new google.maps.places.AutocompleteService();
    // PlacesService requiere un nodo DOM como host, pero NO necesita
    // estar en el árbol del documento. Un div en memoria funciona y
    // evita contaminar el DOM real.
    const dummyDiv = document.createElement('div');
    placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);
    sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
  }, [isLoaded]);

  // Cleanup del debounce timer al desmontar.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
    setError(null);
  }, []);

  const fetchPredictions = useCallback(
    (input: string) => {
      const service = autocompleteServiceRef.current;
      const token = sessionTokenRef.current;
      if (!service || !token) {
        // SDK aún no cargó — el siguiente cambio re-disparará la búsqueda
        // si el user sigue escribiendo, así que no es necesario poner
        // error visible al user.
        return;
      }

      const request: google.maps.places.AutocompletionRequest = {
        input,
        sessionToken: token,
        types: ['establishment'],
        componentRestrictions: { country },
      };

      if (userLocation) {
        request.location = new google.maps.LatLng(
          userLocation.lat,
          userLocation.lng,
        );
        request.radius = DEFAULT_BIAS_RADIUS_M;
      }

      setIsSearching(true);
      setError(null);

      service.getPlacePredictions(request, (results, status) => {
        setIsSearching(false);

        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          results
        ) {
          const mapped: PlacePrediction[] = results
            .slice(0, maxResults)
            .map((r) => ({
              placeId: r.place_id,
              mainText: r.structured_formatting.main_text,
              secondaryText:
                r.structured_formatting.secondary_text ?? '',
              description: r.description,
            }));
          setPredictions(mapped);
        } else if (
          status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
        ) {
          setPredictions([]);
        } else {
          setPredictions([]);
          setError(ERROR_MESSAGE);
        }
      });
    },
    [country, userLocation, maxResults],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);

      // Cancelar debounce previo — solo el último input dispara fetch.
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (value.trim().length < minChars) {
        setPredictions([]);
        setError(null);
        return;
      }

      debounceTimerRef.current = setTimeout(() => {
        fetchPredictions(value.trim());
      }, debounceMs);
    },
    [minChars, debounceMs, fetchPredictions],
  );

  const getPlaceDetails = useCallback(
    (placeId: string): Promise<PlaceDetails> => {
      return new Promise((resolve, reject) => {
        const service = placesServiceRef.current;
        if (!service) {
          reject(new Error('PlacesService no inicializado — SDK aún no carga'));
          return;
        }

        service.getDetails(
          {
            placeId,
            fields: ['name', 'formatted_address', 'geometry'],
            // Pasar el sessionToken acá agrupa este getDetails con los
            // autocompletes previos para billing — Google factura como
            // 1 sesión en lugar de N requests independientes.
            sessionToken: sessionTokenRef.current ?? undefined,
          },
          (place, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              place?.geometry?.location
            ) {
              resolve({
                name: place.name ?? '',
                address: place.formatted_address ?? '',
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              });

              // Best practice de Google: rotar el sessionToken DESPUÉS
              // de cada getDetails. Esa sesión ya se cerró; la próxima
              // búsqueda arranca con token nuevo (nueva sesión = nuevo
              // billing).
              sessionTokenRef.current =
                new google.maps.places.AutocompleteSessionToken();
            } else {
              reject(new Error(`getDetails failed: ${status}`));
            }
          },
        );
      });
    },
    [],
  );

  return {
    query,
    predictions,
    isSearching,
    error,
    handleInputChange,
    getPlaceDetails,
    clearPredictions,
  };
}
