import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import AddressSearchBar from './AddressSearchBar';

describe('AddressSearchBar', () => {
  it('no muestra el dropdown cuando el input tiene menos de 3 chars', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddressSearchBar onSelect={vi.fn()} />);
    const input = screen.getByTestId('address-search-input');
    await user.click(input);
    await user.type(input, 'ab');
    expect(screen.queryAllByTestId('address-suggestion')).toHaveLength(0);
  });

  it('muestra sugerencias al escribir 3+ chars', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddressSearchBar onSelect={vi.fn()} />);
    const input = screen.getByTestId('address-search-input');
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
  });

  it('llama onSelect al clickear una sugerencia', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(<AddressSearchBar onSelect={onSelect} />);
    const input = screen.getByTestId('address-search-input');
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
    expect(onSelect).toHaveBeenCalledTimes(1);
    const arg = onSelect.mock.calls[0][0];
    expect(arg.location.lat).toBeTypeOf('number');
    expect(arg.fullAddress).toContain('Uninorte');
  });

  it('usa el placeholder por defecto si no se pasa uno', () => {
    renderWithProviders(<AddressSearchBar onSelect={vi.fn()} />);
    expect(
      screen.getByPlaceholderText('¿A dónde vas?'),
    ).toBeInTheDocument();
  });
});
