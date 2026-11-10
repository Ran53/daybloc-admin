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
        description: 'Admin dashboard for DayBloc developer chats',
        theme_color: '#0a84ff',
        background_color: '#121212',
        display: 'standalone',
        // ✅ FIX: Add the subpath to start_url and scope
        start_url: '/daybloc-admin/',
        scope: '/daybloc-admin/',
        icons: [
          {
            src: 'vite.svg', // Replace with a real icon path later
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  base: '/daybloc-admin/',
})