import { useQuery } from '@tanstack/react-query';
import { dataSource } from '../lib/dataSource';
import type { LatLng } from '../types';

/**
 * Pide al backend qué bus tomar para ir de userLocation a destination.
 *
 * Devuelve top N recomendaciones rankeadas por tiempo total puerta-a-puerta.
 * Solo dispara cuando ambos puntos están definidos.
 *
 * Refresca cada 15s para mantener ETAs vivos (los buses se mueven).
 */
export function useRouteRecommendation(
  userLocation: LatLng | undefined,
  destination: LatLng | null,
) {
  const enabled =
    userLocation != null &&
    destination != null &&
    Number.isFinite(userLocation.lat) &&
    Number.isFinite(destination.lat);

  return useQuery({
    queryKey: [
      'route-recommend-smart',
      userLocation?.lat,
      userLocation?.lng,
      destination?.lat,
      destination?.lng,
    ],
    queryFn: () =>
      dataSource.recommendRouteSmart({
        userLocation: userLocation!,
        destination: destination!,
        // 700m = ~9 cuadras. Suficientemente generoso para que casi
        // siempre haya 2-3 alts (varias rutas pasan en este radio en
        // BAQ), pero sin pedirle al user que camine 1+ km. Las alts
        // se ordenan por walk_to_board ASC, así que las primeras
        // siempre son las más cercanas.
        maxWalkingM: 700,
        maxAlternatives: 5,
      }),
    enabled,
    staleTime: 10_000,
    refetchInterval: 15_000, // ETAs se mueven, actualizamos
    refetchOnWindowFocus: false,
  });
}
