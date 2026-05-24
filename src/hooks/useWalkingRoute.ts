import { useQuery } from '@tanstack/react-query';
import { dataSource } from '../lib/dataSource';
import type { LatLng } from '../types';
import type { BackendWalkDirections } from '../types/backend';

/**
 * Polyline de caminata entre 2 puntos siguiendo calles reales.
 * Backend cachea 24h (Mapbox walking), así que repetir queries es gratis.
 *
 * Si from o to es null/undefined, no dispara la query.
 */
export function useWalkingRoute(
  from: LatLng | null | undefined,
  to: LatLng | null | undefined,
) {
  const enabled =
    from != null &&
    to != null &&
    Number.isFinite(from.lat) &&
    Number.isFinite(to.lat);

  return useQuery<BackendWalkDirections>({
    queryKey: [
      'walking-route',
      from?.lat.toFixed(5),
      from?.lng.toFixed(5),
      to?.lat.toFixed(5),
      to?.lng.toFixed(5),
    ],
    queryFn: () => dataSource.getWalkingRoute(from!, to!),
    enabled,
    staleTime: 24 * 60 * 60_000, // 24h
    gcTime: 24 * 60 * 60_000,
    refetchOnWindowFocus: false,
  });
}
