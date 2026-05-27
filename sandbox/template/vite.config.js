import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,

    // ✅ IMPORTANT: correct HMR for reverse proxy / ingress setup
    hmr: {
      protocol: 'ws',
      clientPort: 80,   // must match ingress port, not Vite's internal port (5173)
    },

    // ❌ disable polling (it was causing reload loops)
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**']
    }
  }
})