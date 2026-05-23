import { useQuery } from '@tanstack/react-query';
import { dataSource } from '../lib/dataSource';

export function useAdminMetrics() {
  return useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => dataSource.getAdminMetrics(),
    refetchInterval: 5_000,
    staleTime: 2_000,
  });
}

export function useAdminFeed(limit = 50) {
  return useQuery({
    queryKey: ['admin-feed', limit],
    queryFn: () => dataSource.getAdminFeed(limit),
    refetchInterval: 10_000,
  });
}
