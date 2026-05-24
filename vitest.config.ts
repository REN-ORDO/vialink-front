import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_USE_MOCKS': JSON.stringify('false'),
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3000'),
    // Key fake para tests de googlePlaces (KEY se lee a module-init).
    // El test global setupTests.ts mockea hasGooglePlacesKey()=false
    // para forzar el path de fallback en el resto de tests; los tests
    // específicos de googlePlaces.test.ts hacen vi.unmock para testear
    // el path real con esta key.
    'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(
      'TEST_FAKE_GMAPS_KEY',
    ),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setupTests.ts'],
    css: false,
    // Excluir worktrees y otras paths que no son del source principal.
    exclude: ['node_modules/**', 'dist/**', '.claude/**', '.git/**'],
    env: {
      VITE_USE_MOCKS: 'false',
      VITE_API_URL: 'http://localhost:3000',
      VITE_GOOGLE_MAPS_API_KEY: 'TEST_FAKE_GMAPS_KEY',
    },
    server: {
      deps: {
        inline: ['msw'],
      },
    },
  },
});
