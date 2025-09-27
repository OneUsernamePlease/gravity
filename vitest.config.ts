import { defineConfig } from 'vite';
export default defineConfig({
  // This is the default public directory and root.
  root: '.',
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.{test,spec}.{ts,js}'],

  },
});
