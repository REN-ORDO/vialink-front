import { useMutation } from '@tanstack/react-query';
import { dataSource } from '../lib/dataSource';
import type { LatLng } from '../types';

export function useCreateWaitSession() {
  return useMutation({
    mutationFn: (input: {
      location: LatLng;
      route_id?: string;
      notify_seconds_before?: number;
    }) => dataSource.createWaitSession(input),
  });
}

export function useCancelWaitSession() {
  return useMutation({
    mutationFn: (id: string) => dataSource.cancelWaitSession(id),
  });
}
