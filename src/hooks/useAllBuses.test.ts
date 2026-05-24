import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '../test/utils';
import { busesMock } from '../lib/mockData';

// useRealtime real abre un socket; en test no queremos eso.
vi.mock('./useRealtime', () => ({
  useRealtime: () => ({ status: 'idle' }),
}));

import { useAllBuses } from './useAllBuses';

describe('useAllBuses', () => {
  it('carga el snapshot inicial via dataSource.listAllBuses', async () => {
    const { result } = renderHookWithProviders(() => useAllBuses('BAQ'));

    expect(result.current.buses).toHaveLength(0);
    expect(result.current.isLoading).toBe(true);

    await waitFor(
      () => {
        expect(result.current.buses.length).toBeGreaterThan(0);
      },
      { timeout: 2000 },
    );

    // El MSW handler de /buses devuelve busesMock mapeado a backend shape.
    // El mapper lo convierte de vuelta a Bus, así que los IDs coinciden.
    expect(result.current.buses.map((b) => b.id).sort()).toEqual(
      busesMock.map((b) => b.id).sort(),
    );
  });

  it('cada bus tiene lat/lng/heading/operatorId', async () => {
    const { result } = renderHookWithProviders(() => useAllBuses('BAQ'));
    await waitFor(() => expect(result.current.buses.length).toBeGreaterThan(0), {
      timeout: 2000,
    });
    for (const b of result.current.buses) {
      expect(typeof b.lat).toBe('number');
      expect(typeof b.lng).toBe('number');
      expect(typeof b.heading).toBe('number');
      expect(b.operatorId).toMatch(/^bus_(amarillo|azul)_pto$/);
    }
  });
});
