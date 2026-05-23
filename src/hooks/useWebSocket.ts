import { useEffect, useRef, useState } from 'react';
import { WS_URL } from '../lib/api';

type Status = 'idle' | 'connecting' | 'open' | 'closed' | 'error';

type Options<T> = {
  path: string;
  enabled?: boolean;
  onMessage?: (data: T) => void;
  reconnectMs?: number;
};

export function useWebSocket<T = unknown>({
  path,
  enabled = true,
  onMessage,
  reconnectMs = 2500,
}: Options<T>) {
  const [status, setStatus] = useState<Status>('idle');
  const wsRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef(onMessage);
  const retryRef = useRef<number | null>(null);

  handlerRef.current = onMessage;

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;

    function connect() {
      if (stopped) return;
      setStatus('connecting');
      let ws: WebSocket;
      try {
        ws = new WebSocket(`${WS_URL}${path}`);
      } catch {
        setStatus('error');
        scheduleRetry();
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => setStatus('open');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as T;
          handlerRef.current?.(data);
        } catch {
          /* ignore non-JSON frames */
        }
      };
      ws.onerror = () => setStatus('error');
      ws.onclose = () => {
        setStatus('closed');
        scheduleRetry();
      };
    }

    function scheduleRetry() {
      if (stopped) return;
      if (retryRef.current) window.clearTimeout(retryRef.current);
      retryRef.current = window.setTimeout(connect, reconnectMs);
    }

    connect();

    return () => {
      stopped = true;
      if (retryRef.current) window.clearTimeout(retryRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [path, enabled, reconnectMs]);

  function send(payload: unknown) {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  return { status, send };
}
