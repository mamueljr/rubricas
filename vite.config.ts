import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/rubricas/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['iconos/icono.svg'],
      manifest: {
        name: 'Rúbricas ESISCOM',
        short_name: 'Rúbricas',
        description: 'Evaluación de proyectos por rúbricas.',
        lang: 'es',
        theme_color: '#4f46e5',
        background_color: '#eef1f8',
        display: 'standalone',
        start_url: '/rubricas/',
        scope: '/rubricas/',
        icons: [
          { src: 'iconos/icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'iconos/icono-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'iconos/icono-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/rubricas/index.html',
      },
    }),
  ],
})
