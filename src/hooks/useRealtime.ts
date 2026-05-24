import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { WS_URL, getAccessToken } from '../lib/api';
import type { RealtimeEvent } from '../types';

export type RealtimeStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error';

export type RealtimeRoom =
  | 'admin'
  | `city:${string}`
  | `trip:${string}`
  | `bus:${string}`
  | `wait:${string}`
  | `user:${string}`;

type EventName = RealtimeEvent['type'];

type Handler<E extends RealtimeEvent = RealtimeEvent> = (event: E) => void;

type Options = {
  rooms?: RealtimeRoom[];
  enabled?: boolean;
  handlers?: Partial<{ [K in EventName]: Handler }>;
};

let sharedSocket: Socket | null = null;
let sharedRefcount = 0;

function ensureSocket(): Socket {
  if (sharedSocket && sharedSocket.connected) return sharedSocket;
  if (sharedSocket) return sharedSocket;
  const token = getAccessToken();
  sharedSocket = io(WS_URL, {
    path: '/realtime',
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1500,
    auth: token ? { token } : undefined,
  });
  return sharedSocket;
}

function releaseSocket() {
  sharedRefcount -= 1;
  if (sharedRefcount <= 0 && sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
    sharedRefcount = 0;
  }
}

export function useRealtime({
  rooms = [],
  enabled = true,
  handlers = {},
}: Options) {
  const [status, setStatus] = useState<RealtimeStatus>('idle');
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    setStatus('connecting');
    sharedRefcount += 1;
    const socket = ensureSocket();

    function onConnect() {
      setStatus('open');
      for (const room of rooms) {
        socket.emit('subscribe', { room });
      }
    }
    function onDisconnect() {
      setStatus('closed');
    }
    function onError() {
      setStatus('error');
    }

    // CRÍTICO: guardar las referencias a los handlers de ESTE mount
    // para poder pasárselas a socket.off() en el cleanup. Si llamáramos
    // socket.off(eventName) sin handler específico, borraría los
    // listeners de TODAS las instancias de useRealtime que comparten
    // el shared socket (incluyendo el de useAllBuses) — lo cual hacía
    // que al cambiar selectedBusId se perdieran momentáneamente los
    // bus_position events para todos los buses.
    const localHandlers = new Map<
      EventName,
      (event: RealtimeEvent) => void
    >();

    const eventNames: EventName[] = [
      'bus_position',
      'trip_update',
      'incident_reported',
      'wait_session_alert',
      'metrics_update',
      'agent_action',
      'user_action',
    ];

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);
    for (const name of eventNames) {
      const handler = (event: RealtimeEvent) => {
        const h = handlersRef.current[name];
        if (h) h(event);
      };
      localHandlers.set(name, handler);
      socket.on(name, handler);
    }

    if (socket.connected) onConnect();

    return () => {
      for (const room of rooms) {
        socket.emit('unsubscribe', { room });
      }
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
      // Borrar SOLO los handlers de esta instancia, no los de otras
      // instancias que comparten el shared socket.
      for (const [name, handler] of localHandlers) {
        socket.off(name, handler);
      }
      releaseSocket();
    };
  }, [enabled, rooms.join('|')]);

  function emit(name: string, payload: unknown) {
    sharedSocket?.emit(name, payload);
  }

  return { status, emit };
}
