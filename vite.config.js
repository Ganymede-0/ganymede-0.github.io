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
    rollupOptions: {
      output: {
        // Split the vendor weight off the app code. `three` alone is the bulk of
        // this bundle; keeping it in its own chunk means the browser can parse
        // and cache it independently, and a copy edit to the CV data no longer
        // invalidates a megabyte of engine code in every returning visitor's
        // cache. Postprocessing is separated for the same reason.
        // Rolldown (Vite 8) requires the function form — the object map that
        // Rollup accepted throws "manualChunks is not a function" here.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          const path = id.replace(/\\/g, '/')
          // Order matters: '@react-three/postprocessing' contains both
          // '@react-three' and 'postprocessing', and every '@react-three/*'
          // package contains the substring 'three'. Most specific first.
          // three core first: its path is `node_modules/three/...` which
          // contains '/three/', while '@react-three/...' contains '-three/'
          // and so cannot collide.
          if (path.includes('/three/')) return 'three'
          if (path.includes('@react-three')) return 'r3f'
          if (path.includes('postprocessing')) return 'postprocessing'
          if (path.includes('/gsap/')) return 'motion'
        },
      },
    },
  },
})