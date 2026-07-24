import ReactDOM from 'react-dom/client'
import App from './App'

// Note: intentionally NOT wrapped in <React.StrictMode>. StrictMode double-
// invokes mount/unmount in dev, which tears down and re-inits the
// postprocessing EffectComposer — the second pass can bind disposed render
// targets and black out the entire canvas. Everything here is already
// effect-clean; the tradeoff isn't worth a void.
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
