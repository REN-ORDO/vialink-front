import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/utils';
import { busesMock } from '../lib/mockData';

vi.mock('../components/map/MapView', () => ({
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="mock-mapview">{children}</div>
  ),
}));
vi.mock('react-leaflet', async () => {
  const actual = await vi.importActual<typeof import('react-leaflet')>(
    'react-leaflet',
  );
  return {
    ...actual,
    Polyline: ({ positions }: { positions: [number, number][] }) => (
      <div
        data-testid="mock-polyline"
        data-points={String(positions.length)}
      />
    ),
  };
});
vi.mock('../components/map/ParaderoMarker', () => ({ default: () => null }));
vi.mock('../components/map/buses3d/Bus3DMarker', () => ({
  default: ({
    bus,
    onClick,
  }: {
    bus: { id: string };
    onClick?: (id: string) => void;
  }) => (
    <button
      type="button"
      data-testid={`mock-bus-${bus.id}`}
      onClick={() => onClick?.(bus.id)}
    />
  ),
}));
vi.mock('../components/map/UserLocationMarker', () => ({
  default: () => null,
  FollowUser: () => null,
  DisableFollowOnDrag: () => null,
}));
vi.mock('../hooks/useRealtime', () => ({
  useRealtime: () => ({ status: 'idle' }),
}));

import MapaPage from './MapaPage';

describe('MapaPage · integración geocode → route-recommendation', () => {
  it('al seleccionar una direccion, abre el sheet de recomendacion de ruta', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MapaPage />);

    const input = await screen.findByTestId('address-search-input');
    await user.click(input);
    await user.type(input, 'Uninorte');

    await waitFor(
      () => {
        expect(
          screen.getAllByTestId('address-suggestion').length,
        ).toBeGreaterThan(0);
      },
      { timeout: 2000 },
    );

    await user.click(screen.getAllByTestId('address-suggestion')[0]);

    await waitFor(
      () => {
        expect(
          screen.getByTestId('route-recommendation-sheet'),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it('filtra paraderos al escribir en el input de filtro', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MapaPage />);

    const filterInput = await screen.findByTestId('paradero-filter-input');
    await user.type(filterInput, 'Buenavista');

    await waitFor(() => {
      expect(screen.getByText(/Buenavista/i)).toBeInTheDocument();
      expect(screen.queryByText(/Plaza de la Paz/i)).not.toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Limpiar filtro'));
    await waitFor(() => {
      expect(screen.getByText(/Plaza de la Paz/i)).toBeInTheDocument();
    });
  });

  it('al clickear un bus mock (id no-UUID), abre el sheet con mensaje de simulado', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MapaPage />);

    const firstBus = busesMock[0]; // id "b1" — no es UUID
    const marker = await screen.findByTestId(`mock-bus-${firstBus.id}`);
    await user.click(marker);

    await waitFor(
      () => {
        expect(screen.getByTestId('bus-detail-sheet')).toBeInTheDocument();
        expect(screen.getByText(/simulado/i)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // No debe renderizarse polyline para buses simulados (no hay data del backend)
    expect(screen.queryByTestId('mock-polyline')).not.toBeInTheDocument();
  });
});
