import { useEffect, useRef, useState } from 'react';
import { viajeMock } from '../lib/mockData';
import { densify, fetchRoute, type LatLng } from '../lib/routing';
import type { Paradero, Viaje } from '../types';

const TICK_MS = 600;
const COORDS_PER_TICK = 1;

function straightPath(viaje: Viaje): LatLng[] {
  const start: LatLng = { lat: viaje.busLat, lng: viaje.busLng };
  const stops = viaje.paradasRestantes.map<LatLng>((p) => ({
    lat: p.lat,
    lng: p.lng,
  }));
  return densify([start, ...stops], 35);
}

function findClosestIndex(path: LatLng[], target: LatLng): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < path.length; i++) {
    const dLat = path[i].lat - target.lat;
    const dLng = path[i].lng - target.lng;
    const d = dLat * dLat + dLng * dLng;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

export type ViajeState = {
  viaje: Viaje;
  routeCoords: LatLng[];
  tiempoRestanteMin: number;
  paradasRestantes: Paradero[];
  proximoParadero: Paradero;
  routeStatus: 'loading' | 'osrm' | 'fallback';
};

export function useViajeMock(): ViajeState {
  const [routeCoords, setRouteCoords] = useState<LatLng[]>(() =>
    straightPath(viajeMock),
  );
  const [routeStatus, setRouteStatus] = useState<ViajeState['routeStatus']>(
    'loading',
  );

  const [state, setState] = useState({
    viaje: viajeMock,
    cursor: 0,
    paradasRestantes: viajeMock.paradasRestantes,
  });

  const stopIdxRef = useRef<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    const stops: LatLng[] = [
      { lat: viajeMock.busLat, lng: viajeMock.busLng },
      ...viajeMock.paradasRestantes.map((p) => ({ lat: p.lat, lng: p.lng })),
    ];

    fetchRoute(stops).then((path) => {
      if (cancelled) return;
      if (path && path.length > 2) {
        const dense = densify(path, 20);
        setRouteCoords(dense);
        setRouteStatus('osrm');
        stopIdxRef.current = viajeMock.paradasRestantes.map((p) =>
          findClosestIndex(dense, { lat: p.lat, lng: p.lng }),
        );
        setState((prev) => ({ ...prev, cursor: 0 }));
      } else {
        setRouteStatus('fallback');
        const fallback = straightPath(viajeMock);
        stopIdxRef.current = viajeMock.paradasRestantes.map((p) =>
          findClosestIndex(fallback, { lat: p.lat, lng: p.lng }),
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        const path = routeCoords;
        if (path.length < 2) return prev;
        let cursor = prev.cursor + COORDS_PER_TICK;
        let paradasRestantes = prev.paradasRestantes;

        if (cursor >= path.length - 1) {
          cursor = 0;
          paradasRestantes = prev.viaje.paradasRestantes;
        }

        const stopIdxs = stopIdxRef.current;
        if (stopIdxs.length) {
          const passed = stopIdxs.filter((idx) => idx <= cursor).length;
          const remaining = prev.viaje.paradasRestantes.slice(passed);
          paradasRestantes = remaining.length
            ? remaining
            : prev.viaje.paradasRestantes;
        }

        const pos = path[cursor];
        return {
          ...prev,
          viaje: { ...prev.viaje, busLat: pos.lat, busLng: pos.lng },
          cursor,
          paradasRestantes,
        };
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [routeCoords]);

  const proximoParadero =
    state.paradasRestantes[0] ?? state.viaje.proximoParadero;

  const tiempoRestanteMin = Math.max(
    1,
    Math.round(
      (state.paradasRestantes.length / state.viaje.paradasRestantes.length) *
        state.viaje.tiempoRestanteMin,
    ),
  );

  return {
    viaje: state.viaje,
    routeCoords,
    tiempoRestanteMin,
    paradasRestantes: state.paradasRestantes,
    proximoParadero,
    routeStatus,
  };
}
