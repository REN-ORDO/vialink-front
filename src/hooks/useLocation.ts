import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export type LocationStatus =
  /** Estado inicial antes de pedir GPS. */
  | 'idle'
  /** Pidiendo permiso / esperando primer fix (sin cache). */
  | 'loading'
  /** Permiso concedido + tenemos al menos un fix fresco. */
  | 'granted'
  /** Usuario denegó (o el sistema bloqueó). */
  | 'denied'
  /** Browser sin geolocation API. */
  | 'unsupported'
  /** Falla transitoria (timeout, hardware). */
  | 'error';

/** Si el fix persistido es más viejo que esto, lo descartamos al cargar. */
const STALE_LOCATION_MS = 24 * 60 * 60 * 1000; // 24 h

export function useLocation() {
  const userLat = useAppStore((s) => s.userLat);
  const userLng = useAppStore((s) => s.userLng);
  const userLocationAt = useAppStore((s) => s.userLocationAt);
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const clearUserLocation = useAppStore((s) => s.clearUserLocation);

  const [status, setStatus] = useState<LocationStatus>('idle');
  const hadFreshCachedRef = useRef<boolean | null>(null);

  useEffect(() => {
    // Decidir freshness una sola vez en mount. Date.now en effect es
    // permitido por la React purity rule (efectos pueden ser impuros).
    if (hadFreshCachedRef.current === null) {
      const fresh =
        userLat != null &&
        userLng != null &&
        userLocationAt != null &&
        Date.now() - userLocationAt < STALE_LOCATION_MS;
      hadFreshCachedRef.current = fresh;
      // Si el cache está MUY viejo, limpiarlo para no mostrar location
      // engañosa al usuario.
      if (!fresh && userLocationAt != null) {
        clearUserLocation();
      }
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot mount, no cascade
      setStatus('unsupported');
      return;
    }

    let cancelled = false;

    // Si no hay cache válido, marcamos 'loading' mientras esperamos fix.
    // Si SÍ había, lo dejamos en 'idle' (marker visible vía lat/lng cacheados).
    if (!hadFreshCachedRef.current) {
      setStatus('loading');
    }

    // Permissions API: detecta 'denied' sin tener que esperar el timeout
    // de GPS (20s).
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((perm) => {
          if (cancelled) return;
          if (perm.state === 'denied') {
            setStatus('denied');
            clearUserLocation();
            return;
          }
          perm.addEventListener?.('change', () => {
            if (cancelled) return;
            if (perm.state === 'denied') {
              setStatus('denied');
              clearUserLocation();
            }
          });
        })
        .catch(() => {
          /* Permissions API no disponible (Safari antiguo). Ignorar. */
        });
    }

    // Un solo watcher: dispara el primer fix Y los updates subsecuentes.
    // Más simple que getCurrentPosition + watchPosition en paralelo.
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return;
        setUserLocation(pos.coords.latitude, pos.coords.longitude, {
          heading: pos.coords.heading,
          accuracy: pos.coords.accuracy,
        });
        setStatus('granted');
      },
      (err) => {
        if (cancelled) return;
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
          clearUserLocation();
          return;
        }
        // Timeout / hardware fail. NO borramos cache — el marker sigue
        // visible con el último fix válido del store persistido.
        if (!hadFreshCachedRef.current) {
          setStatus('error');
        }
      },
      {
        enableHighAccuracy: true,
        // Timeout largo: GPS frío en móvil tarda 10-20s realista.
        timeout: 20_000,
        // Aceptamos cache reciente del browser (no fuerza siempre hardware).
        maximumAge: 30_000,
      },
    );

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
    // Effect corre una vez al mount. setUserLocation/clearUserLocation
    // son estables (Zustand actions).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    lat: userLat,
    lng: userLng,
    status,
    /**
     * `true` cuando es seguro mostrar el marker del usuario:
     * tenemos lat/lng (incluyendo location cacheada del store persistido)
     * y el status no indica denegado/unsupported.
     */
    hasLocation:
      userLat != null &&
      userLng != null &&
      status !== 'denied' &&
      status !== 'unsupported',
  };
}

export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
