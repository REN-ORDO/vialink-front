import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { BARRANQUILLA_CENTER } from '../lib/mockData';

export type LocationStatus =
  | 'idle'
  | 'loading'
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'error';

export function useLocation() {
  const userLat = useAppStore((s) => s.userLat);
  const userLng = useAppStore((s) => s.userLng);
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const [status, setStatus] = useState<LocationStatus>('idle');

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      setUserLocation(BARRANQUILLA_CENTER.lat, BARRANQUILLA_CENTER.lng);
      return;
    }

    setStatus('loading');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation(pos.coords.latitude, pos.coords.longitude, {
          heading: pos.coords.heading,
          accuracy: pos.coords.accuracy,
        });
        setStatus('granted');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
        } else {
          setStatus('error');
        }
        setUserLocation(BARRANQUILLA_CENTER.lat, BARRANQUILLA_CENTER.lng);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation(pos.coords.latitude, pos.coords.longitude, {
          heading: pos.coords.heading,
          accuracy: pos.coords.accuracy,
        });
        setStatus('granted');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setStatus('denied');
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 2_000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [setUserLocation]);

  return {
    lat: userLat,
    lng: userLng,
    status,
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
