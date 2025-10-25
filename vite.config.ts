import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      devOptions: { enabled: true },
      manifest: {
        name: 'Noticias Agrícolas',
        short_name: 'Agrícola',
        description: 'Noticias, clima y alertas agrícolas incluso sin conexión',
        theme_color: '#16A34A',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Lecturas a Supabase REST
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/rest\/v1\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-supabase',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 },
            },
          },
          {
            // Archivos de Storage (imágenes)
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/.*$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-storage',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            // OpenWeather API
            urlPattern: /^https:\/\/api\.openweathermap\.org\/.*$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'openweather-api',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 10 },
            },
          },
          {
            // Capas de mapas OWM
            urlPattern: /^https:\/\/[abc]\.tile\.openweathermap\.org\/.*$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'openweather-tiles',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            // Escrituras a Supabase (se encolan sin conexión y se reintentan)
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/rest\/v1\/.*$/i,
            handler: 'NetworkOnly',
            method: 'POST',
            options: {
              backgroundSync: {
                name: 'supabase-write-queue',
                options: { maxRetentionTime: 60 * 24 }, // 24h
              },
            },
          },
          {
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/rest\/v1\/.*$/i,
            handler: 'NetworkOnly',
            method: 'PATCH',
            options: {
              backgroundSync: {
                name: 'supabase-write-queue',
                options: { maxRetentionTime: 60 * 24 },
              },
            },
          },
          {
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/rest\/v1\/.*$/i,
            handler: 'NetworkOnly',
            method: 'DELETE',
            options: {
              backgroundSync: {
                name: 'supabase-write-queue',
                options: { maxRetentionTime: 60 * 24 },
              },
            },
          },
        ],
      },
    }),
  ],
})
