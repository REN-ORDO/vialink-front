import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/utils';

vi.mock('../components/map/MapView', () => ({
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="mock-mapview">{children}</div>
  ),
}));
vi.mock('../components/map/ParaderoMarker', () => ({ default: () => null }));
vi.mock('../components/map/buses3d/Bus3DMarker', () => ({ default: () => null }));
vi.mock('../components/map/UserLocationMarker', () => ({
  default: () => null,
  FollowUser: () => null,
  DisableFollowOnDrag: () => null,
}));

import MapaPage from './MapaPage';

describe('MapaPage · integración geocode → buses-at-point', () => {
  it('al seleccionar una direccion, abre el sheet de buses-at-point', async () => {
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
        expect(screen.getByTestId('buses-at-point-sheet')).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
