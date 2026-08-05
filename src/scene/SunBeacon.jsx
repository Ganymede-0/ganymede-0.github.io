import { Html } from '@react-three/drei'
import { useNavigationStore, useCueVisible } from '../state/navigationStore'

// -----------------------------------------------------------------------------
// The star is the way in to the story.
//
// The system is what a visitor lands on, so nothing is gated — a recruiter with
// no patience for narrative can open a project in one click. The approach
// sequence is offered instead of imposed, and the thing offering it is the star
// at the centre, which is the one body that represents Sarah rather than a
// project. Clicking the person to hear the person's story is the only mapping
// that makes sense here.
//
// The invitation is loud exactly once. Before the approach has ever been run it
// is a labelled beacon with a pulse ring, impossible to miss.
//
// Afterwards it disappears entirely and returns ONLY on hover. That is the
// point: the star is the most beautiful object in the scene and it is the
// visitor's own identity in this system — parking a permanent caption on it
// turns it into a button with a star behind it. A body that reveals what it
// does when you reach for it stays a body. The door has not moved; it has
// simply stopped talking to someone who already walked through it.
//
// Rendered as drei <Html> rather than 3D geometry so the type stays crisp and
// screen-sized at any camera distance, and so it is a real focusable <button>
// in the document — the story must be reachable by keyboard, not only by
// clicking a glowing sphere.
// -----------------------------------------------------------------------------

export default function SunBeacon() {
  const stage = useNavigationStore((s) => s.stage)
  const view = useNavigationStore((s) => s.view)
  const cvOpen = useNavigationStore((s) => s.cvOpen)
  const hasSeenApproach = useNavigationStore((s) => s.hasSeenApproach)
  const startApproach = useNavigationStore((s) => s.startApproach)
  const sunHovered = useNavigationStore((s) => s.sunHovered)
  const cueVisible = useCueVisible()

  // Never during the approach itself, mid-flight, or under an open panel.
  //
  // Also never while the nebula cue is up: the star sits at the centre of the
  // frame and the cue is centred on the viewport, so the two would land on top
  // of each other. The cue is the more urgent message at that moment — it is
  // the answer to "what do I do now" — and the beacon's own invitation is
  // redundant to someone who has just come back through the wormhole.
  if (stage !== 'system' || view !== 'overview' || cvOpen || cueVisible) return null

  const first = !hasSeenApproach

  // After the first run the label is only VISIBLE while the pointer is on the
  // star — but it stays in the document, hidden by opacity rather than
  // unmounted, and reappears on keyboard focus.
  //
  // That distinction matters: unmounting it would make the entire story
  // unreachable without a mouse, since the only other way in is clicking a
  // sphere in a WebGL canvas. Hidden-but-focusable keeps the star clean and
  // keeps the keyboard path intact.
  const revealed = first || sunHovered

  return (
    <Html
      // Above the photosphere (radius 2.4) so the label never sits on top of
      // the star's own brightness, where it would be unreadable.
      position={[0, 3.5, 0]}
      center
      // Screen-space, NOT distanceFactor: this is an instruction, and an
      // instruction that shrinks with camera distance is one a visitor on a
      // small screen cannot read. It stays legible at every zoom level.
      zIndexRange={[24, 20]}
      className="sun-beacon__anchor"
    >
      <button
        type="button"
        className={`sun-beacon ${first ? 'is-first' : 'is-quiet'} ${
          revealed ? 'is-revealed' : ''
        }`}
        onClick={startApproach}
        aria-label={
          first
            ? 'Start here — begin the approach sequence and read the story'
            : 'Replay the approach sequence'
        }
      >
        <span className="sun-beacon__pulse" aria-hidden="true" />
        <span className="sun-beacon__pulse sun-beacon__pulse--delayed" aria-hidden="true" />

        <span className="sun-beacon__label">
          <span className="sun-beacon__title">
            {first ? 'Start here' : 'Replay the story'}
          </span>
          {first && (
            <span className="sun-beacon__sub mono">Sarah&rsquo;s story · 60 seconds</span>
          )}
        </span>

        {/* A filament running from the label down into the photosphere, so the
            eye is led to the star rather than stopping at the words. */}
        <span className="sun-beacon__tether" aria-hidden="true" />
      </button>
    </Html>
  )
}
