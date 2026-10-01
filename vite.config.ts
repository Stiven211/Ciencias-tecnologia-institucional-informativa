import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Puerto de desarrollo local (Playwright usa http://localhost:9989)
  server: {
    port: 9989,
    allowedHosts: true,
  }
})
