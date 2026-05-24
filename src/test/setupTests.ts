import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './msw/server';

// En tests no queremos pegarle a Google Places. Force el fallback al
// backend /geocode (MSW handler) reportando "no hay key".
vi.mock('../lib/googlePlaces', async () => {
  const actual =
    await vi.importActual<typeof import('../lib/googlePlaces')>(
      '../lib/googlePlaces',
    );
  return {
    ...actual,
    hasGooglePlacesKey: () => false,
  };
});

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

if (typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
