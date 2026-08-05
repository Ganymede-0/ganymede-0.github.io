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

  // The gate exists only while a transition is in progress.
  //
  // 'system' is a resting state and is never entered through a flash: the dive
  // is covered on arrival at 'prologue', and the way back is covered during
  // 'emerging', which has already faded the light off by the time it completes.
  // Rendering here would fire the fade-from-white a second time on landing —
  // and on a cold load it would open the site with an unexplained white flash.
  if (stage === 'system') return null

  // 'in'  — ramping up: the star swallowing the frame, or the wormhole peaking.
  // 'out' — after a teleport: opaque, then fading off. In 'prologue' that
  //         reveals the story space; in 'emerging' it burns off over the top of
  //         the camera pulling back out of the star, so the system opens out of
  //         the light rather than appearing once the light has gone.
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
