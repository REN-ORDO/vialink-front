import { useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LIBRARIES,
} from '../../config/places';
import { usePlacesAutocomplete } from '../../hooks/usePlacesAutocomplete';
import { useGeolocation } from '../../hooks/useGeolocation';
import type { GeocodeSuggestion, LatLng } from '../../types';

type Props = {
  /** Si el caller ya tiene una ubicación del user (ej. del store global),
   *  la pasa acá y se prioriza sobre useGeolocation. */
  proximity?: LatLng;
  onSelect: (suggestion: GeocodeSuggestion) => void;
  placeholder?: string;
};

/**
 * Buscador de direcciones con Google Places (JS SDK / legacy).
 *
 * Mantiene la misma interfaz externa que la versión vieja
 * (onSelect recibe GeocodeSuggestion). Internamente reemplaza
 * todo: ya no llama al backend ni a la NEW API por fetch — usa
 * google.maps.places.AutocompleteService directo desde el browser.
 *
 * Ventajas vs versión vieja:
 *   - structured_formatting nativo (main_text + secondary_text)
 *   - sessionToken auto-managed por el SDK = billing óptimo
 *   - bias geográfico con location + radius (más preciso que
 *     locationBias.circle de la NEW)
 *   - types: ["establishment"] filtra a negocios/POIs (no
 *     contamina con calles y barrios sueltos)
 */
export default function AddressSearchBar({
  proximity,
  onSelect,
  placeholder,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Carga del SDK. La key + libraries deben ser referencias estables
  // (constantes de módulo) para evitar re-loads.
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: 'es',
    region: 'CO',
  });

  // Si el caller no nos pasa proximity, intentamos browser geolocation
  // como bias. Si tampoco hay, las búsquedas igual funcionan pero sin
  // sesgo geográfico (Google ordena por relevancia global del país).
  const browserGeo = useGeolocation();
  const userLocation: { lat: number; lng: number } | null = proximity
    ? { lat: proximity.lat, lng: proximity.lng }
    : browserGeo.latitude != null && browserGeo.longitude != null
      ? { lat: browserGeo.latitude, lng: browserGeo.longitude }
      : null;

  const {
    query,
    predictions,
    isSearching,
    error,
    handleInputChange,
    getPlaceDetails,
    clearPredictions,
  } = usePlacesAutocomplete({
    minChars: 3,
    debounceMs: 300,
    maxResults: 5,
    userLocation,
    country: 'co',
    isLoaded,
  });

  const open =
    focused && (query.length >= 3 || predictions.length > 0 || !!error);

  async function handlePick(placeId: string) {
    if (resolvingId) return; // bloqueo doble-click
    setResolvingId(placeId);
    try {
      const details = await getPlaceDetails(placeId);
      const suggestion: GeocodeSuggestion = {
        id: placeId,
        label: details.name || details.address,
        fullAddress: details.address,
        location: { lat: details.lat, lng: details.lng },
        category: null,
      };
      onSelect(suggestion);
      // Reseteamos el input al label elegido y cerramos el dropdown.
      handleInputChange(suggestion.label);
      clearPredictions();
      setFocused(false);
    } catch (err) {
      console.warn('No se pudo resolver el lugar:', err);
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder={placeholder ?? '¿A dónde vas?'}
        className="w-full px-4 py-3 rounded-2xl bg-white border border-black/[0.06] text-text-primary text-[15px] placeholder:text-text-secondary/80 outline-none vl-elev-2 vl-headline"
        data-testid="address-search-input"
        autoComplete="off"
        disabled={!isLoaded && !loadError}
      />
      {open && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl vl-elev-3 max-h-64 overflow-y-auto z-50 border border-black/[0.05]">
          {loadError && (
            <li className="px-4 py-3 text-error text-sm">
              No pudimos cargar Google Maps. Revisá la API key.
            </li>
          )}
          {!loadError && !isLoaded && (
            <li className="px-4 py-3 text-text-secondary text-sm">
              Cargando buscador…
            </li>
          )}
          {isLoaded && isSearching && (
            <li className="px-4 py-3 text-text-secondary text-sm">
              Buscando…
            </li>
          )}
          {isLoaded && error && !isSearching && (
            <li className="px-4 py-3 text-error text-sm">{error}</li>
          )}
          {isLoaded &&
            !isSearching &&
            !error &&
            predictions.length === 0 &&
            query.length >= 3 && (
              <li
                className="px-4 py-3 text-text-secondary text-sm"
                data-testid="address-empty"
              >
                No encontramos esa dirección
              </li>
            )}
          {predictions.map((p) => {
            const isResolving = resolvingId === p.placeId;
            return (
              <li key={p.placeId}>
                <button
                  type="button"
                  disabled={!!resolvingId}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handlePick(p.placeId)}
                  className="cursor-pointer w-full text-left px-4 py-3 hover:bg-surface-raised active:bg-surface-raised border-b border-black/[0.05] last:border-b-0 disabled:opacity-60"
                  data-testid="address-suggestion"
                >
                  <div className="font-medium text-text-primary text-[14.5px] vl-headline">
                    {p.mainText || p.description}
                    {isResolving && (
                      <span className="ml-2 text-xs text-text-secondary font-normal">
                        resolviendo…
                      </span>
                    )}
                  </div>
                  {p.secondaryText && (
                    <div className="text-xs text-text-secondary truncate mt-0.5">
                      {p.secondaryText}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
