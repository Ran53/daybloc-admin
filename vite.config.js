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
        // ✅ Use relative paths. Vite will automatically prepend /daybloc-admin/
        start_url: './', 
        scope: './',
        display: 'standalone',
        theme_color: '#0a84ff',
        background_color: '#121212',
        icons: [
          {
            src: 'vite.svg', // Vite will resolve this to /daybloc-admin/vite.svg
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  base: '/daybloc-admin/',
})