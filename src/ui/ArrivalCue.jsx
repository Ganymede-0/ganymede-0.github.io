import { projects, CATEGORY } from '../data/projects'
import { useNavigationStore } from '../state/navigationStore'

// -----------------------------------------------------------------------------
// What to do, said once, on arrival.
//
// The failure mode this exists to prevent: a visitor who is not a 3D-web native
// lands in a dark scene containing small moving spheres and no obvious verb.
// The old affordance was eleven-pixel tracked uppercase text in the top-right
// corner — the lowest-attention region of the viewport, and the first thing
// banner blindness discards.
//
// This names the actual targets rather than describing the interaction in the
// abstract. "Select a body to open the project" assumes the visitor has already
// worked out that the spheres are projects; listing Raha, Bayan and Sharqiyah
// as buttons proves it. Clicking a name flies the camera exactly as clicking
// the planet does, so the cue is also a complete alternative route in for
// anyone who would rather not chase a moving object — including keyboard users.
//
// It appears once per session and dismisses on the first meaningful action, so
// it informs without becoming furniture.
// -----------------------------------------------------------------------------

export default function ArrivalCue() {
  const stage = useNavigationStore((s) => s.stage)
  const view = useNavigationStore((s) => s.view)
  const onboarded = useNavigationStore((s) => s.onboarded)
  const dismissOnboarding = useNavigationStore((s) => s.dismissOnboarding)
  const focusBody = useNavigationStore((s) => s.focusBody)
  const setHovered = useNavigationStore((s) => s.setHovered)

  const eligible = stage === 'system' && !onboarded && view === 'overview'

  if (!eligible) return null

  const bodies = projects.filter((p) => p.category === CATEGORY.PLANET)

  // The entrance — including the beat of delay that lets the wormhole settle
  // before this appears — is a CSS animation rather than a timer driving state.
  // A setTimeout/setState pair would re-render the tree purely to change a
  // class name, and would need teardown on every dependency change. The
  // animation runs on mount, costs nothing, and cannot leak.
  return (
    <div className="arrival-cue" role="region" aria-label="Getting started">
      <p className="arrival-cue__lead">
        You&rsquo;ve arrived. Each planet is a project — open one.
      </p>

      <ul className="arrival-cue__bodies">
        {bodies.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              className="arrival-cue__body"
              style={{ '--body-accent': p.color }}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(p.id)}
              onBlur={() => setHovered(null)}
              onClick={() => {
                dismissOnboarding()
                focusBody(p.id)
              }}
            >
              <span className="arrival-cue__dot" aria-hidden="true" />
              {p.name}
            </button>
          </li>
        ))}
      </ul>

      <p className="arrival-cue__hint mono">
        Or drag anywhere to look around · full CV on the left
      </p>

      <button
        type="button"
        className="arrival-cue__dismiss"
        onClick={dismissOnboarding}
      >
        Got it
      </button>
    </div>
  )
}
