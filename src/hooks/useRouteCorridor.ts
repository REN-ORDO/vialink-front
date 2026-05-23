import { useQuery } from '@tanstack/react-query';
import { dataSource } from '../lib/dataSource';

export function useRouteCorridor(routeId: string | undefined) {
  return useQuery({
    queryKey: ['route-corridor', routeId],
    queryFn: () => dataSource.getRouteCorridor(routeId!),
    enabled: !!routeId,
    staleTime: 60 * 60_000,
  });
}
