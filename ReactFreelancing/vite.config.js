import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/users': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/admin': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/projects': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/applications': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
    },
  },
})
