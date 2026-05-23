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

    const dispatch =
      <K extends EventName>(name: K) =>
      (event: RealtimeEvent) => {
        const h = handlersRef.current[name];
        if (h) h(event);
      };

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
      socket.on(name, dispatch(name));
    }

    if (socket.connected) onConnect();

    return () => {
      for (const room of rooms) {
        socket.emit('unsubscribe', { room });
      }
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
      for (const name of eventNames) {
        socket.off(name);
      }
      releaseSocket();
    };
  }, [enabled, rooms.join('|')]);

  function emit(name: string, payload: unknown) {
    sharedSocket?.emit(name, payload);
  }

  return { status, emit };
}
