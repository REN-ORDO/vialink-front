import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { dataSource } from '../lib/dataSource';
import type { Paradero } from '../types';

export function useParaderos() {
  const userLat = useAppStore((s) => s.userLat);
  const userLng = useAppStore((s) => s.userLng);
  const location =
    userLat != null && userLng != null
      ? { lat: userLat, lng: userLng }
      : undefined;

  return useQuery<Paradero[]>({
    queryKey: ['paraderos', location?.lat ?? 'baq', location?.lng ?? 'baq'],
    queryFn: () => dataSource.getLandmarksNearby(location, 1500),
    staleTime: 60_000,
  });
}

export function useParadero(id: string | undefined) {
  return useQuery<Paradero>({
    queryKey: ['paradero', id],
    queryFn: () => dataSource.getLandmark(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}
