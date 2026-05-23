import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_USE_MOCKS': JSON.stringify('false'),
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3000'),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setupTests.ts'],
    css: false,
    env: {
      VITE_USE_MOCKS: 'false',
      VITE_API_URL: 'http://localhost:3000',
    },
    server: {
      deps: {
        inline: ['msw'],
      },
    },
  },
});
