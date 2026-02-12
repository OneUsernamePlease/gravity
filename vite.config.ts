import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  // This is the default public directory and root.
  root: 'src',
  // Configure build options
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true
  },
  base: "/gravity",
  plugins: [
    tailwindcss(),
  ]
});
