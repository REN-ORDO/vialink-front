import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataSource } from '../lib/dataSource';
import { operatorFromRouteCode } from '../lib/mappers';
import { useRealtime } from './useRealtime';
import type { Bus, BusPosition } from '../types';

/**
 * Estado global de TODOS los buses IN_SERVICE en la ciudad.
 *
 * - Snapshot inicial: GET /buses?city=BAQ (via TanStack Query).
 * - Live updates:    WebSocket room "city:BAQ", evento bus_position.
 *
 * Las actualizaciones del WS se acumulan en un buffer y se aplican una
 * sola vez por frame (requestAnimationFrame), lo cual es crítico cuando
 * llegan 86+ eventos casi simultáneos. Sin esto el render se dispara
 * varias veces por segundo por bus.
 */
export function useAllBuses(city = 'BAQ') {
  const [buses, setBuses] = useState<Bus[]>([]);
  const bufferRef = useRef<Map<string, Bus>>(new Map());
  const rafRef = useRef<number | null>(null);

  const snapshot = useQuery({
    queryKey: ['all-buses', city],
    queryFn: () => dataSource.listAllBuses(city),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Seed cuando llega snapshot REST
  useEffect(() => {
    if (!snapshot.data) return;
    for (const b of snapshot.data) bufferRef.current.set(b.id, b);
    setBuses(Array.from(bufferRef.current.values()));
  }, [snapshot.data]);

  const scheduleFlush = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setBuses(Array.from(bufferRef.current.values()));
    });
  }, []);

  useRealtime({
    rooms: [`city:${city}`],
    handlers: {
      bus_position: (e) => {
        const ev = e as BusPosition;
        const existing = bufferRef.current.get(ev.busId);
        bufferRef.current.set(ev.busId, {
          id: ev.busId,
          rutaNombre: ev.routeCode,
          lat: ev.location.lat,
          lng: ev.location.lng,
          heading: ev.heading ?? existing?.heading ?? 0,
          operatorId:
            ev.operatorId ??
            existing?.operatorId ??
            operatorFromRouteCode(ev.routeCode),
        });
        scheduleFlush();
      },
    },
  });

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    buses,
    isLoading: snapshot.isLoading,
    error: snapshot.error,
  };
}
