import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,

    // ✅ HMR disabled — the AI agent writes files directly and the frontend
    //    triggers iframe refreshes manually. Vite's HMR WebSocket reconnects
    //    through the ingress proxy cause full page reloads inside the iframe.
    hmr: false,

    // Disable file watching too — agent rewrites files, preview is refreshed manually
    watch: {
      usePolling: false,
      ignored: ['**/*']
    }
  }
})