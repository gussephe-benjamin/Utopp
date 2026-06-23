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
        bypass(req) {
          const frontendOnlyPaths = ['/auth/callback']
          const url = req.url ?? ''
          if (frontendOnlyPaths.some((path) => url.startsWith(path))) {
            return '/index.html'
          }
          return null
        },
      },
    },
  },
})
