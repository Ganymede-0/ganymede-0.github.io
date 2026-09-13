import { Suspense } from 'react'
import Scene from './scene/Scene'
import Hud from './ui/Hud'
import StarGate from './ui/StarGate'
import MissionPanel from './ui/MissionPanel'
import MediaDossier from './ui/MediaDossier'
import LetterReader from './ui/LetterReader'
import CvDossier from './ui/CvDossier'
import CursorHud from './ui/CursorHud'
import SoundToggle from './ui/SoundToggle'
import AudioDirector from './ui/AudioDirector'
import StarFallback from './ui/StarFallback'
import './styles/tokens.css'
import './styles/ui.css'
import './styles/stargate.css'
import './styles/dossier-cv.css'
import './styles/dossier.css'
import './styles/letter.css'

// The canvas is a single persistent scene beneath everything. It is never
// unmounted or remounted — the warp into the star and back out only changes who
// is driving the camera. That continuity is the whole effect: the visitor never
// crosses a loading boundary.
export default function App() {
  return (
    <>
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
        <CvDossier />

        {/* Above both panels and over the scene. Outside .overlay for the same
            reason CvPanel is: .overlay is its own stacking context, so anything
            that must rise above the CV panel has to be a sibling of it. */}
        <MediaDossier />
        {/* The recommendation letter. Same layer and same reason as the
            walkthrough: it has to rise above the mission panel it opens from. */}
        <LetterReader />
      </div>

      {/* The light that covers the warp's cut — see StarGate. */}
      <StarGate />

      {/* Outside .app so it survives every view, including the CV, which hides
          the rest of the HUD. */}
      <SoundToggle />
      {/* No markup — it just listens to the store and plays. */}
      <AudioDirector />

      {/* OUTSIDE .app, and last. Giving .app a z-index made it a stacking
          context, which traps everything inside it — however high the reticle's
          own z-index goes, it can never rise above a sibling of .app. As a
          top-level last child it composites above everything, which is the only
          correct place for something that replaces the native cursor. */}
      <CursorHud />
    </>
  )
}
