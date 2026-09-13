import { useNavigationStore } from '../state/navigationStore'

// -----------------------------------------------------------------------------
// The light that covers the warp's cut.
//
// The fall into the star ends on a frame of pure white, and that frame is where
// the CV opens. It is never seen happening, because at the moment it does there
// is nothing on screen but light.
//
// It is DOM rather than a quad in the scene, for two reasons. A full-viewport
// additive plane would still be tone-mapped and bloomed on its way through the
// composer, so "pure white" would come out as a grey wash. And it must cover
// the drei <Html> layer, which sits above the canvas and would otherwise show
// planet labels floating over a white screen.
//
// The gradient is not a flat fill: it blooms from the centre outward, matching
// where the star is in frame at the end of the dive. A flat white rectangle
// reads as a page transition; a bloom reads as light.
// -----------------------------------------------------------------------------

export default function StarGate() {
  const stage = useNavigationStore((s) => s.stage)

  // Only the way IN is covered. 'system' is a resting state — rendering there
  // would open the site with an unexplained flash. And 'emerging' needs no
  // cover: the camera starts at the photosphere, which already fills the frame
  // with light, and pulling back out of it IS the reveal. A white flash on top
  // would punish the visitor for clicking "Back to orbit".
  if (stage !== 'diving' && stage !== 'cv') return null

  // 'in'  — ramping up while the star swallows the frame.
  // 'out' — opaque, then fading off to reveal the CV.
  const phase = stage === 'diving' ? 'in' : 'out'

  return (
    // Keyed on stage so each phase remounts the element and its animation
    // restarts cleanly from zero. Without the key the change of class would
    // leave the old animation running against the new one.
    <div key={stage} className={`star-gate star-gate--${phase}`} aria-hidden="true" />
  )
}
