import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo, el frontend corre en el puerto de Vite y el backend
    // en el suyo (ver backend/src/index.ts, PORT=4000 por defecto). Este
    // proxy hace que fetch('/api/...') funcione igual que en producción,
    // donde Express sirve todo desde un único origen.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
