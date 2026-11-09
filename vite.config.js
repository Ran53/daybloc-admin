// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // If your repo is named "daybloc-admin", this should be '/daybloc-admin/'
  base: '/daybloc-admin/', 
})