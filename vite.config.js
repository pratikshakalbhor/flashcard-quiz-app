import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      base: './',
      // Never register a service worker during `vite dev`. This prevents a stale
      // precached bundle from being served while you are developing.
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: 'Flashcard Quiz App',
        short_name: 'Flashcards',
        description:
          'A study flashcard app with multiple decks, Leitner spaced repetition, stats, and JSON import/export. Data persists in your browser.',
        theme_color: '#6d28d9',
        background_color: '#f4f2fb',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precaching so the app works offline after first visit. Assets generated
        // by Vite are included via globPatterns.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,json}'],
      },
    }),
  ],
  base: './',
})
