import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { dataSource } from '../lib/dataSource';
import type { LatLng } from '../types';

function useDebounced<T>(value: T, ms = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function useGeocode(query: string, proximity?: LatLng) {
  const debouncedQuery = useDebounced(query, 350);
  const enabled = debouncedQuery.trim().length >= 3;
  return useQuery({
    queryKey: ['geocode', debouncedQuery, proximity?.lat, proximity?.lng],
    queryFn: () => dataSource.geocode(debouncedQuery, proximity, 5),
    enabled,
    staleTime: 60 * 60_000,
    gcTime: 60 * 60_000,
  });
}
