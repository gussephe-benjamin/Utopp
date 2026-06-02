import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/google': {
        target: 'http://utopp-backend-1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://utopp-backend-1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
