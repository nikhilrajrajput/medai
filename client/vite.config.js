import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  base: '/medai/',
    server: {
    proxy: {
      '/api': {
        target: 'https://medai-2122.vercel.app',
        changeOrigin: true,
      },
    },
  }
})
