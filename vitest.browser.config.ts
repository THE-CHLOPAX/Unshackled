import path from 'path';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

import { version } from './package.json';

// Real-browser tests only — for anything needing an actual WebGL context
// (jsdom has none). Kept separate from vitest.config.ts so the default
// `npm test` stays fast and doesn't need a Chromium binary installed.
// Run with `npm run test:browser` (requires `npx playwright install chromium`
// once, to fetch the browser binary).
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  test: {
    include: ['**/*.browser.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
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
