import type { LatLng } from '../types';

export function secondsToHuman(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '—';
  if (s < 60) return `${Math.round(s)} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) return `${h} h`;
  return `${h} h ${rem} min`;
}

export function metersToHuman(m: number): string {
  if (!Number.isFinite(m) || m < 0) return '—';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`;
}

export function minutesToHuman(min: number): string {
  return secondsToHuman(min * 60);
}

export function kmToMeters(km: number): number {
  return Math.round(km * 1000);
}

export function geoJsonToLeaflet(
  coords: [number, number][],
): [number, number][] {
  return coords.map(([lng, lat]) => [lat, lng]);
}

export function leafletToGeoJson(
  coords: [number, number][],
): [number, number][] {
  return coords.map(([lat, lng]) => [lng, lat]);
}

export function latLngArrayFromGeoJson(
  coords: [number, number][],
): LatLng[] {
  return coords.map(([lng, lat]) => ({ lat, lng }));
}

export function etaWindowColor(seconds: number): 'success' | 'brand' | 'warning' | 'muted' {
  const min = seconds / 60;
  if (min <= 5) return 'success';
  if (min <= 15) return 'brand';
  if (min <= 30) return 'warning';
  return 'muted';
}
