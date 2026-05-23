import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dataSource } from '../lib/dataSource';
import type { LatLng } from '../types';

export function useActiveTrip() {
  return useQuery({
    queryKey: ['trip-active'],
    queryFn: () => dataSource.getActiveTrip(),
    staleTime: 10_000,
  });
}

export function useStartTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      route_id: string;
      boarding_location: LatLng;
      dropoff_location: LatLng;
      boarding_landmark_id?: string;
      dropoff_landmark_id?: string;
    }) => dataSource.startTrip(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-active'] }),
  });
}

export function useCompleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) =>
      dataSource.updateTripStatus(tripId, 'COMPLETED'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-active'] }),
  });
}

export function useCancelTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) =>
      dataSource.updateTripStatus(tripId, 'CANCELLED'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-active'] }),
  });
}

export function useRateTrip() {
  return useMutation({
    mutationFn: (input: {
      tripId: string;
      stars: number;
      comment?: string;
    }) => dataSource.rateTrip(input.tripId, input.stars, input.comment),
  });
}
