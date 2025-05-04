import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['dockernest.net', 'www.dockernest.net'],
    host: '0.0.0.0',
    port: 3000
  }
})
