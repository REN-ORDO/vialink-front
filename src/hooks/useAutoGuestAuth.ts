import { useEffect, useRef, useState } from 'react';
import { dataSource } from '../lib/dataSource';
import { getAccessToken, setAuthTokens, USE_MOCKS } from '../lib/api';

export type AuthBootstrapStatus = 'idle' | 'signing-up' | 'ready' | 'error';

function randomGuestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  }
  return Math.random().toString(36).slice(2, 18);
}

function buildGuestCredentials() {
  const id = randomGuestId();
  return {
    email: `guest-${id}@vialink.app`,
    password: `vl-guest-${id}-2026`,
    name: 'Invitado',
  };
}

/**
 * Si el usuario no tiene token, crea una cuenta anonima automaticamente.
 * Idempotente: solo corre una vez. Si ya hay token o si USE_MOCKS=true,
 * marca ready inmediato sin tocar red.
 */
export function useAutoGuestAuth(): AuthBootstrapStatus {
  const started = useRef(false);
  const [status, setStatus] = useState<AuthBootstrapStatus>(() => {
    if (USE_MOCKS) return 'ready';
    return getAccessToken() ? 'ready' : 'idle';
  });

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (USE_MOCKS) {
      setStatus('ready');
      return;
    }
    if (getAccessToken()) {
      setStatus('ready');
      return;
    }

    setStatus('signing-up');
    (async () => {
      try {
        const creds = buildGuestCredentials();
        const result = await dataSource.signup(creds);
        setAuthTokens(result.tokens);
        setStatus('ready');
      } catch (err) {
        console.warn('[vialink] auto-guest signup fallo', err);
        setStatus('error');
      }
    })();
  }, []);

  return status;
}
