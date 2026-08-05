import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },

  // ---------------------------------------------------------------------------
  // The 3D layer.
  //
  // eslint-plugin-react-hooks v7 ships the React Compiler's purity rules, which
  // assume React owns rendering and that anything reachable from a component is
  // immutable between renders. React Three Fiber's model is the opposite by
  // design: `useFrame` runs on the renderer's own loop, OUTSIDE React's render
  // cycle, against a retained-mode WebGL scene graph that persists across
  // renders. Advancing a shader uniform or a mesh rotation in there is not a
  // side effect that escaped — it is the entire supported programming model,
  // and the alternative (routing per-frame values through state) would
  // re-render the tree at display rate.
  //
  // These three rules therefore cannot be satisfied by correct R3F code, so
  // they are scoped off here rather than silenced with dozens of inline
  // disables. Everything else — exhaustive-deps, rules-of-hooks,
  // set-state-in-effect — still applies, and the UI layer keeps the full set.
  // ---------------------------------------------------------------------------
  {
    files: ['src/scene/**/*.{js,jsx}'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
    },
  },
])
