import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '../test/utils';
import { useBusDetails } from './useBusDetails';

describe('useBusDetails', () => {
  it('no consulta cuando busId es null', () => {
    const { result } = renderHookWithProviders(() => useBusDetails(null));
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('consulta y mapea cuando hay busId', async () => {
    const { result } = renderHookWithProviders(() => useBusDetails('550e8400-e29b-41d4-a716-446655440000'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 2000,
    });
    expect(result.current.data?.route.code).toBe('C12');
    expect(result.current.data?.polyline.length).toBeGreaterThan(0);
    expect(result.current.data?.etaToUser).toBeNull();
  });

  it('incluye etaToUser cuando se pasa user location', async () => {
    const { result } = renderHookWithProviders(() =>
      useBusDetails('550e8400-e29b-41d4-a716-446655440000', { lat: 11.0186, lng: -74.8499 }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 2000,
    });
    expect(result.current.data?.etaToUser).not.toBeNull();
    expect(result.current.data?.etaToUser?.etaSeconds).toBe(320);
  });

  it('marca isError cuando el bus no existe (404)', async () => {
    const { result } = renderHookWithProviders(() =>
      useBusDetails('550e8400-e29b-41d4-a716-446655440404'),
    );
    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 2000,
    });
  });
});
