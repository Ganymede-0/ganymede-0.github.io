import { Suspense } from 'react'
import Scene from './scene/Scene'
import Hud from './ui/Hud'
import Prologue from './ui/Prologue'
import StarGate from './ui/StarGate'
import ArrivalCue from './ui/ArrivalCue'
import MissionPanel from './ui/MissionPanel'
import MediaDossier from './ui/MediaDossier'
import CvPanel from './ui/CvPanel'
import CursorHud from './ui/CursorHud'
import StarFallback from './ui/StarFallback'
import './styles/tokens.css'
import './styles/ui.css'
import './styles/prologue.css'
import './styles/nebula.css'
import './styles/dossier.css'

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

        {/* Sits above both panels and covers the scene. Outside .overlay for
            the same reason CvPanel is: .overlay is its own stacking context,
            so anything that must rise above the CV panel has to be a sibling
            of it rather than a descendant of the HUD layer. */}
        <MediaDossier />
      </div>

      {/* Scroll-driven approach. Renders null once the visitor has arrived. */}
      <Prologue />

      {/* The light that covers both teleports — see StarGate. Above the
          prologue, below the cursor. */}
      <StarGate />

      {/* OUTSIDE .app, and last. Giving .app a z-index made it a stacking
          context, which traps everything inside it — however high the reticle's
          own z-index goes, it can never rise above a sibling of .app. The
          prologue is such a sibling, so the cursor was being painted under the
          entire approach sequence. As a top-level last child it composites
          above everything, which is the only correct place for something that
          replaces the native cursor. */}
      <CursorHud />
    </>
  )
}
