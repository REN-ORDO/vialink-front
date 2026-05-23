import { useQuery } from '@tanstack/react-query';
import { dataSource } from '../lib/dataSource';
import type { LatLng } from '../types';

export function useBusesAtPoint(location: LatLng | null, radiusM = 100) {
  return useQuery({
    queryKey: ['buses-at-point', location?.lat, location?.lng, radiusM],
    queryFn: () => dataSource.getBusesAtPoint(location!, radiusM),
    enabled: !!location,
    staleTime: 3_000,
    refetchInterval: false,
  });
}
