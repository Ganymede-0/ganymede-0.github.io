import { Suspense } from 'react'
import Scene from './scene/Scene'
import Hud from './ui/Hud'
import MissionPanel from './ui/MissionPanel'
import CvPanel from './ui/CvPanel'
import CursorHud from './ui/CursorHud'
import StarFallback from './ui/StarFallback'
import './styles/tokens.css'
import './styles/ui.css'

export default function App() {
  return (
    <div className="app">
      {/* No boot sequence — the system is live on first paint. The star is a
          pure Suspense fallback: if nothing suspends, it never renders. */}
      <Suspense fallback={<StarFallback />}>
        <Scene />
      </Suspense>
      <div className="overlay">
        <Hud />
        <MissionPanel />
      </div>
      <CvPanel />
      <CursorHud />
    </div>
  )
}
