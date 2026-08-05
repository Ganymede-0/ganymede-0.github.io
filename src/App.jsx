import { Suspense } from 'react'
import Scene from './scene/Scene'
import Hud from './ui/Hud'
import Prologue from './ui/Prologue'
import ArrivalCue from './ui/ArrivalCue'
import MissionPanel from './ui/MissionPanel'
import CvPanel from './ui/CvPanel'
import CursorHud from './ui/CursorHud'
import StarFallback from './ui/StarFallback'
import './styles/tokens.css'
import './styles/ui.css'
import './styles/prologue.css'

// The canvas is a single persistent scene beneath everything. It is never
// unmounted or remounted between the approach sequence and the system — the
// prologue only changes who is driving the camera. That continuity is the whole
// effect: the visitor never crosses a loading boundary, they just arrive.
export default function App() {
  return (
    <>
      {/* Fixed, full-viewport, and always present. The prologue is a SIBLING
          rather than a child: it has to sit in normal document flow for the
          page to scroll natively, which it cannot do inside a fixed ancestor. */}
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
        <ArrivalCue />
        <CvPanel />
        <CursorHud />
      </div>

      {/* Scroll-driven approach. Renders null once the visitor has arrived. */}
      <Prologue />
    </>
  )
}
