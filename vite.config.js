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
    // The 3D engine (three + @react-three + postprocessing) is one large chunk
    // and it is needed on first paint — the system IS the landing — so the
    // limit is raised past it rather than warning on every build.
    chunkSizeWarningLimit: 1100,

    rollupOptions: {
      output: {
        // Vendor splitting, via Rolldown's advancedChunks rather than the
        // classic `manualChunks` callback. The point is caching: a copy edit to
        // the CV data must not invalidate a megabyte of engine code in every
        // returning visitor's cache.
        //
        // WHY NOT manualChunks
        // It silently did not work under Rolldown. Returning 'react' from it
        // produced no such chunk — React was merged into the r3f group — and
        // unmatched packages (zustand) were swept in with it. advancedChunks is
        // Rolldown's own API and groups deterministically by regex, in order.
        //
        // ORDER MATTERS. '@react-three/postprocessing' contains both
        // '@react-three' and 'postprocessing', and every '@react-three/*' path
        // contains the substring 'three'. Anchoring each test on the package
        // directory boundary removes the ambiguity entirely.
        advancedChunks: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|use-sync-external-store)[\\/]/ },
            { name: 'state', test: /node_modules[\\/]zustand[\\/]/ },
            { name: 'motion', test: /node_modules[\\/]gsap[\\/]/ },
            { name: 'r3f', test: /node_modules[\\/]@react-three[\\/]/ },
            { name: 'postprocessing', test: /node_modules[\\/](postprocessing|@monogrid)[\\/]/ },
            { name: 'three', test: /node_modules[\\/]three(-stdlib)?[\\/]/ },
            // Catch-all, last, so no future ungrouped package lands somewhere
            // arbitrary and silently changes what the entry chunk depends on.
            { name: 'vendor', test: /node_modules/ },
          ],
        },
      },
    },
  },
})