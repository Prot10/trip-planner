import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5199,
    /* storage refs are relative URLs (/storage/images/...): in dev they
       must reach the agent server on 5200 (or VITE_AGENT_PORT) */
    proxy: { '/storage': `http://localhost:${process.env.VITE_AGENT_PORT ?? 5200}` },
  },
})
