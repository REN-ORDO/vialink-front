import { useEffect, useState } from 'react';

/**
 * Wrapper one-shot sobre navigator.geolocation.getCurrentPosition.
 *
 * Devuelve `{ latitude, longitude, error, loading }`. Útil para pasar
 * la ubicación del user a usePlacesAutocomplete como bias geográfico.
 *
 * NOTA: este proyecto también tiene `useLocation` (con persistencia
 * en Zustand). Este hook es deliberadamente más simple — one-shot al
 * mount, sin watchers, sin persistencia. Pensado para sesgar las
 * búsquedas de Places, no para trackear al user en el mapa.
 */
export type GeolocationState = {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
};

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setState({
        latitude: null,
        longitude: null,
        error: 'Geolocation no soportado en este browser',
        loading: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (err) => {
        setState({
          latitude: null,
          longitude: null,
          error: err.message,
          loading: false,
        });
      },
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 60_000 },
    );
  }, []);

  return state;
}
