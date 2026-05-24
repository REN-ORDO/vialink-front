import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { renderHookWithProviders } from '../test/utils';
import { useLocation } from './useLocation';
import { useAppStore } from '../store/useAppStore';

// jsdom no trae navigator.geolocation. Mockeamos un stub que no resuelve
// (sin disparar fix ni error). Suficiente para testear el path de cache
// inicial sin que el effect marque status='unsupported'.
function stubGeolocation() {
  const watchPosition = vi.fn().mockReturnValue(1);
  const clearWatch = vi.fn();
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { watchPosition, clearWatch, getCurrentPosition: vi.fn() },
  });
  return { watchPosition, clearWatch };
}

describe('useLocation', () => {
  beforeEach(() => {
    stubGeolocation();
    useAppStore.getState().clearUserLocation();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('arranca con hasLocation=false si no hay cache persistido', () => {
    // Sin navigator.geolocation en jsdom el status va a 'unsupported'.
    const { result } = renderHookWithProviders(() => useLocation());
    expect(result.current.lat).toBeNull();
    expect(result.current.lng).toBeNull();
    expect(result.current.hasLocation).toBe(false);
  });

  it('arranca con hasLocation=true si el store tiene location reciente', () => {
    // Seed location reciente ANTES del primer render.
    act(() => {
      useAppStore.getState().setUserLocation(11.0186, -74.8499, {
        heading: 90,
        accuracy: 25,
      });
    });

    const { result } = renderHookWithProviders(() => useLocation());

    expect(result.current.lat).toBeCloseTo(11.0186, 3);
    expect(result.current.lng).toBeCloseTo(-74.8499, 3);
    expect(result.current.hasLocation).toBe(true);
  });

  it('clearUserLocation borra todo el location state', () => {
    act(() => {
      useAppStore.getState().setUserLocation(11.0186, -74.8499);
    });
    expect(useAppStore.getState().userLat).not.toBeNull();
    expect(useAppStore.getState().userLocationAt).not.toBeNull();

    act(() => {
      useAppStore.getState().clearUserLocation();
    });
    expect(useAppStore.getState().userLat).toBeNull();
    expect(useAppStore.getState().userLng).toBeNull();
    expect(useAppStore.getState().userHeading).toBeNull();
    expect(useAppStore.getState().userAccuracy).toBeNull();
    expect(useAppStore.getState().userLocationAt).toBeNull();
  });

  it('persiste la location en localStorage', () => {
    act(() => {
      useAppStore.getState().setUserLocation(11.0186, -74.8499, {
        heading: 45,
        accuracy: 10,
      });
    });

    const raw = localStorage.getItem('vialink-app-state');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    // Zustand persist envuelve el state en { state: {...}, version }
    expect(parsed.state.userLat).toBeCloseTo(11.0186, 3);
    expect(parsed.state.userLng).toBeCloseTo(-74.8499, 3);
    expect(parsed.state.userHeading).toBe(45);
    expect(parsed.state.userAccuracy).toBe(10);
    expect(typeof parsed.state.userLocationAt).toBe('number');
    // NO debe persistir followUser / selectedParaderoId.
    expect(parsed.state.followUser).toBeUndefined();
    expect(parsed.state.selectedParaderoId).toBeUndefined();
  });
});
