import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/* Promo site. Built with base /MyTripPlanner/ for GitHub Pages
   (SITE_BASE=/MyTripPlanner/), plain / for local dev. */
export default defineConfig({
  base: process.env.SITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  build: { outDir: '../dist-site', emptyOutDir: true },
  server: { port: 5197 },
})
