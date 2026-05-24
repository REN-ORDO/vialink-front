import { useQuery } from '@tanstack/react-query';
import { dataSource } from '../lib/dataSource';
import type { LatLng } from '../types';

export function useBusDetails(busId: string | null, userLocation?: LatLng) {
  return useQuery({
    queryKey: ['bus-details', busId, userLocation?.lat, userLocation?.lng],
    queryFn: () => dataSource.getBusDetails(busId!, userLocation),
    enabled: !!busId,
    staleTime: 1_000,
    refetchInterval: false,
    retry: false,
  });
}
