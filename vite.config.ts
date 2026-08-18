import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from "node:url";

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
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src/scripts", import.meta.url))
    }
  }
});
