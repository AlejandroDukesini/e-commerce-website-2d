import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 7 (stable) + @vitejs/plugin-react — aligned peer versions, no ERESOLVE.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5471,
    // Non-strict: if 5471 is momentarily busy, Vite picks the next free port
    // instead of crashing at httpServerStart. Free 5471 explicitly (see README)
    // when you need that exact port.
    strictPort: false,
    // Bind on all interfaces so both 127.0.0.1 and [::1] (localhost) resolve,
    // and the LAN URL is printed.
    host: true,
    // Proxy API calls in dev so the browser talks same-origin (no CORS surprises).
    proxy: {
      '/api': {
        // 127.0.0.1 (not "localhost") to avoid IPv6 resolution mismatches.
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
    },
  },
  preview: { port: 5471, strictPort: false, host: true },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Split vendor libs so the interactive canvas code can be lazy-loaded
        // without dragging React into every route chunk. Function form works
        // in both Rollup (Vite ≤7) and Rolldown (Vite 8), so it's future-proof.
        manualChunks(id) {
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'react-vendor';
          }
        },
      },
    },
  },
});
