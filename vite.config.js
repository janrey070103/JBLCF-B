import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
// server.host: true binds ALL interfaces (IPv4 + IPv6) so localhost,
// 127.0.0.1, and [::1] all resolve. Without this, Windows may bind Vite
// to IPv6-only and the browser's IPv4 "localhost" lookup gets refused.
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    https: true, // Enables camera access when testing from a phone/device on the same LAN
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      // Forward /uploads/ requests to the Go backend so photos load in dev
      '/uploads': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
