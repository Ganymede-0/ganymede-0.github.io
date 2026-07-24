import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ---------------------------------------------------------------------------
// GitHub Pages base path
// ---------------------------------------------------------------------------
// Two ways to host this on GitHub Pages:
//
// 1) RECOMMENDED for a primary portfolio: name the repo "ganymede-0.github.io".
//    GitHub serves that repo at the domain root (https://ganymede-0.github.io/),
//    so `base` should stay '/'. This is what's configured below.
//
// 2) If you'd rather keep it as a normal project repo (e.g. "space-portfolio"),
//    it will be served at https://ganymede-0.github.io/space-portfolio/, so
//    change `base` to '/space-portfolio/' (must match the repo name exactly,
//    including the trailing slash on both sides).
// ---------------------------------------------------------------------------
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
})