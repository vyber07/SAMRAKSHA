import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.tsx'],
    globals: true
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/auth': {
        target: 'http://api:8000',
        changeOrigin: true
      },
      '/cases': {
        target: 'http://api:8000',
        changeOrigin: true
      },
      '/patrol': {
        target: 'http://api:8000',
        changeOrigin: true
      },
      '/incident': {
        target: 'http://api:8000',
        changeOrigin: true
      },
      '/docs': {
        target: 'http://api:8000',
        changeOrigin: true
      },
      '/map': {
        target: 'http://api:8000',
        changeOrigin: true
      },
      '/cctv': {
        target: 'http://api:8000',
        changeOrigin: true
      },
      '/assistant': {
        target: 'http://api:8000',
        changeOrigin: true
      },
      '/legal': {
        target: 'http://api:8000',
        changeOrigin: true
      },
      '/ws': {
        target: 'http://api:8000',
        changeOrigin: true,
        ws: true
      },
      '/admin': {
        target: 'http://api:8000',
        changeOrigin: true
      },
      '/analytics': {
        target: 'http://api:8000',
        changeOrigin: true
      }
    }
  }
})
