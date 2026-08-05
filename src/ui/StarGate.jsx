import { useNavigationStore } from '../state/navigationStore'

// -----------------------------------------------------------------------------
// The light that covers the cut.
//
// Both transitions — falling into the star, and bursting back out through the
// wormhole — end on a frame of pure white. That frame is where the camera is
// actually teleported: from the surface of the photosphere to a pocket of deep
// space on the way in, and back to the system framing on the way out. Neither
// jump is ever seen, because at the moment it happens there is nothing on
// screen but light.
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
  const hasSeenApproach = useNavigationStore((s) => s.hasSeenApproach)

  // Nothing on a cold load. The 'out' phase is a fade FROM white, so rendering
  // it on first paint would open the site with an unexplained white flash —
  // the overlay must not exist until a transition has actually happened.
  if (stage === 'system' && !hasSeenApproach) return null

  // 'in'  — ramping up: the star swallowing the frame, or the wormhole peaking.
  // 'out' — the frame after a teleport: opaque, then fading off to reveal
  //         wherever the visitor has landed.
  const phase = stage === 'diving' || stage === 'returning' ? 'in' : 'out'

  return (
    // Keyed on stage so each transition remounts the element and its animation
    // restarts cleanly from zero. Without the key a re-render mid-transition
    // would leave the old animation running against the new class.
    <div
      key={stage}
      className={`star-gate star-gate--${phase} star-gate--${stage}`}
      aria-hidden="true"
    />
  )
}
