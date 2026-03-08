import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    base: '/admin/',
    server: {
    host: '0.0.0.0',
    port: 3001,
    strictPort: true,
    cors: true,
    allowedHosts: ['171.244.62.122'],
  },
  plugins: [react()],
})
