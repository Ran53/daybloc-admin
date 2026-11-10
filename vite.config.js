// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'DayBloc Admin',
        short_name: 'DayBloc',
        // ❌ REMOVED: start_url: './',
        scope: '/daybloc-admin/', 
        display: 'standalone',
        theme_color: '#0a84ff',
        background_color: '#121212',
        icons: [
          {
            src: 'vite.svg', 
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  base: '/daybloc-admin/',
})