import { useQuery } from '@tanstack/react-query';
import { dataSource } from '../lib/dataSource';
import { USE_MOCKS } from '../lib/api';
import type { LatLng } from '../types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isRealBusId(busId: string | null | undefined): boolean {
  if (!busId) return false;
  // En mocks, cualquier id es valido (b1, b2, etc).
  // En modo backend, solo aceptamos UUIDs reales para evitar
  // 400 "Validation failed (uuid is expected)" del backend.
  return USE_MOCKS || UUID_RE.test(busId);
}

export function useBusDetails(busId: string | null, userLocation?: LatLng) {
  const callable = isRealBusId(busId);
  return useQuery({
    queryKey: ['bus-details', busId, userLocation?.lat, userLocation?.lng],
    queryFn: () => dataSource.getBusDetails(busId!, userLocation),
    enabled: callable,
    staleTime: 1_000,
    refetchInterval: false,
    retry: false,
  });
}
