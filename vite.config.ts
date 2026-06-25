import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // modificacion de puerto a 9988
  server: {
    port: 9988,
  }
})
