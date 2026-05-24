import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import AddressSearchBar from './AddressSearchBar';

// Google Maps JS SDK no carga en jsdom — mockeamos el loader para
// que el input no quede deshabilitado y los hooks puedan inicializar.
vi.mock('@react-google-maps/api', () => ({
  useJsApiLoader: () => ({ isLoaded: true, loadError: null }),
}));

// useGeolocation pediría permiso de browser que no hay en jsdom.
// Mockeamos sin ubicación — el hook de autocomplete acepta null.
vi.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  }),
}));

// Mock determinístico del hook de autocomplete con state local.
// Devuelve una predicción cuando el input tiene >= 3 chars, simula
// la API real (handleInputChange actualiza query → predictions).
vi.mock('../../hooks/usePlacesAutocomplete', () => ({
  usePlacesAutocomplete: () => {
    const [query, setQuery] = useState('');
    const predictions =
      query.length >= 3
        ? [
            {
              placeId: 'mock-uninorte-id',
              mainText: 'Universidad del Norte',
              secondaryText: 'Barranquilla, Atlántico',
              description: 'Universidad del Norte, Barranquilla, Atlántico',
            },
          ]
        : [];
    return {
      query,
      predictions,
      isSearching: false,
      error: null,
      handleInputChange: setQuery,
      getPlaceDetails: async () => ({
        name: 'Universidad del Norte',
        // Incluye "Uninorte" en el address para que el test de assert
        // toContain('Uninorte') pase.
        address: 'Km 5 Vía Puerto Colombia, Uninorte, Barranquilla',
        lat: 10.9876,
        lng: -74.7965,
      }),
      clearPredictions: () => setQuery(''),
    };
  },
}));

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
