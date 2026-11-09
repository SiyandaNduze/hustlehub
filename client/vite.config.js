import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Development-only CSP. Vite's hot reload injects inline scripts/styles and
// uses a websocket, so this is looser than production. The production build
// is served by Express, which applies the strict 'self'-only policy.
const devCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' ws://localhost:5173",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join('; ');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      'Content-Security-Policy': devCsp,
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
    // In development the browser talks to Vite, which forwards /api to the
    // HTTPS backend (secure:false accepts the local self-signed certificate).
    proxy: {
      '/api': { target: 'https://localhost:5443', secure: false, changeOrigin: true },
    },
  },
  build: {
    sourcemap: false, // don't publish source maps with the production build
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
    css: false,
  },
});
