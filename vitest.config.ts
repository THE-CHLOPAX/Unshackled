import path from 'path';
import { defineConfig } from 'vitest/config';

import { version } from './package.json';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // Real-browser tests (needing an actual WebGL context — jsdom has none)
    // live in vitest.browser.config.ts instead; run via `npm run test:browser`.
    exclude: ['**/node_modules/**', '**/*.browser.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@main': path.resolve(__dirname, './src/main'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@tgdf': path.resolve(__dirname, './src/lib'),
      renderer: path.resolve(__dirname, './src/renderer'),
      '3D': path.resolve(__dirname, './src/renderer/3D'),
      UI: path.resolve(__dirname, './src/renderer/UI'),
      Views: path.resolve(__dirname, './src/renderer/Views'),
      Store: path.resolve(__dirname, './src/renderer/Store'),
      WorldEditor: path.resolve(__dirname, './src/renderer/WorldEditor'),
    },
  },
});
