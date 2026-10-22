/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// The app is served from the GitHub Pages project path, also in dev (ADR-8).
const BASE = '/Simon-game/';
const BACKGROUND = '#0A1628';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      strategies: 'generateSW',
      // No auto-update: a new version must never reload an active game (ADR-6)
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        // Never change this id: installed apps are identified by it (ADR-9)
        id: `${BASE}app`,
        name: 'Simon',
        short_name: 'Simon',
        description: 'משחק סיימון: זוכרים את רצף הצבעים והצלילים ומשחזרים אותו.',
        lang: 'he',
        dir: 'rtl',
        display: 'standalone',
        orientation: 'portrait',
        start_url: BASE,
        scope: BASE,
        background_color: BACKGROUND,
        theme_color: BACKGROUND,
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,webmanifest}'],
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
        // No skipWaiting / clientsClaim: the new worker waits until the app is closed
        skipWaiting: false,
        clientsClaim: false,
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
