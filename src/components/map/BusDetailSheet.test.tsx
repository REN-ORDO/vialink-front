import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import BusDetailSheet from './BusDetailSheet';

describe('BusDetailSheet', () => {
  it('no renderiza nada cuando busId es null', () => {
    const { container } = renderWithProviders(
      <BusDetailSheet busId={null} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('muestra info del bus cuando hay busId', async () => {
    renderWithProviders(<BusDetailSheet busId="bus-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByTestId('bus-detail-sheet')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/C12/i)).toBeInTheDocument();
      expect(screen.getByText(/Centro - Uninorte/i)).toBeInTheDocument();
    });
  });

  it('llama onClose al clickear el boton de cerrar', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<BusDetailSheet busId="bus-1" onClose={onClose} />);
    const closeBtn = await screen.findByLabelText('Cerrar');
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('muestra mensaje de "bus completado" cuando backend devuelve 410', async () => {
    renderWithProviders(
      <BusDetailSheet busId="completed-bus" onClose={vi.fn()} />,
    );
    await waitFor(() => {
      expect(screen.getByText(/complet/i)).toBeInTheDocument();
    });
  });

  it('muestra mensaje de "no disponible" cuando bus no existe (404)', async () => {
    renderWithProviders(
      <BusDetailSheet busId="missing-bus" onClose={vi.fn()} />,
    );
    await waitFor(() => {
      expect(screen.getByText(/no disponible/i)).toBeInTheDocument();
    });
  });
});
