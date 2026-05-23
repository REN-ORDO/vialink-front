import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '../test/utils';
import { useGeocode } from './useGeocode';

describe('useGeocode', () => {
  it('no consulta si el query tiene menos de 3 chars', () => {
    const { result } = renderHookWithProviders(() => useGeocode('ab'));
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('consulta y devuelve sugerencias para query >= 3 chars', async () => {
    const { result } = renderHookWithProviders(() => useGeocode('Uninorte'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 2000,
    });
    expect((result.current.data ?? []).length).toBeGreaterThan(0);
    expect(result.current.data?.[0].fullAddress).toContain('Uninorte');
  });
});
