import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg','icons/icon-192.png','icons/icon-512.png'],
      manifest: {
        name: 'PL Coach IDEAL',
        short_name: 'PL IDEAL',
        description: 'Пауэрлифтинг: план, замены, анатомия, чек-ин, КБЖУ. Офлайн + пароль.',
        theme_color: '#07070a',
        background_color: '#07070a',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      }
    })
  ],
  server: { port: 5173 }
})
