import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@burger/shared': fileURLToPath(
        new URL('../shared/src/index.ts', import.meta.url),
      ),
    },
  },
  css: {
    modules: {
      generateScopedName:
        process.env.NODE_ENV === 'test'
          ? '[local]'
          : '[name]_[local]_[hash:base64:6]',
    },
  },
  test: {
    clearMocks: true,
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    css: true,
  },
});
