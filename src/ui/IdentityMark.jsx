import { useState } from 'react'
import { useNavigationStore } from '../state/navigationStore'
import { useReducedMotion } from '../scene/useReducedMotion'

// -----------------------------------------------------------------------------
// THE IDENTITY MARK — the top-left corner.
//
// WHAT IT IS TRYING TO BE
// A crew plate on an instrument: an orbital emblem, a designation, a name, and
// the two facts that place the person. The emblem is not decoration — it is the
// same object the visitor is looking at (a body inside an inclined orbit), which
// is what ties the corner to the scene instead of parking a CV header on top of
// one.
//
// SENTENCE CASE, THROUGHOUT
// Nothing here is set in capitals. Uppercase is a shouting register and it was
// making a quiet corner loud; the hierarchy is carried by size, weight and
// colour instead, which is what lets the name stay the loudest thing in it
// while still being set at a light weight. Acronyms keep their own capitals —
// "AI" and "MLOps" are spelled that way, which is not the same thing as setting
// a word in capitals for emphasis.
//
// The rule running out to the right is borrowed from technical drawings: it
// anchors the block to the frame and gives the eye somewhere to leave.
// -----------------------------------------------------------------------------

function OrbitEmblem() {
  return (
    <svg className="mark__emblem" viewBox="0 0 72 72" aria-hidden="true">
      <defs>
        <radialGradient id="markBody" cx="38%" cy="34%" r="70%">
          <stop offset="0%" stopColor="#cdd6ff" />
          <stop offset="55%" stopColor="#6f7bd6" />
          <stop offset="100%" stopColor="#2b2f6b" />
        </radialGradient>
      </defs>

      {/* The outer ring: the frame of the plate. */}
      <circle cx="36" cy="36" r="31" className="mark__ring" />

      {/* Two inclined orbits, crossing — the system in miniature. */}
      <ellipse cx="36" cy="36" rx="30" ry="11" className="mark__orbit"
        transform="rotate(-24 36 36)" />
      <ellipse cx="36" cy="36" rx="24" ry="8" className="mark__orbit mark__orbit--inner"
        transform="rotate(18 36 36)" />

      {/* The body at the centre, lit from the upper left like the star lights
          everything else in the scene. */}
      <circle cx="36" cy="36" r="11.5" fill="url(#markBody)" />

      {/* Two bodies riding the rings. */}
      <circle cx="9.5" cy="27" r="2.1" className="mark__moon" />
      <circle cx="59" cy="47" r="1.6" className="mark__moon mark__moon--far" />
    </svg>
  )
}

export default function IdentityMark() {
  const spinEmblem = useNavigationStore((s) => s.spinEmblem)
  const reducedMotion = useReducedMotion()
  const [spinning, setSpinning] = useState(false)

  return (
    <div className="mark">
      {/* The emblem is a real control: it sounds a short figure and turns once.
          A button rather than a click handler on the svg, so it is reachable by
          keyboard and announces itself properly. */}
      <button
        type="button"
        className={`mark__emblem-btn ${spinning ? 'is-spinning' : ''}`}
        onClick={() => {
          spinEmblem()
          if (!reducedMotion) setSpinning(true)
        }}
        onAnimationEnd={() => setSpinning(false)}
        aria-label="Sound the system"
      >
        <OrbitEmblem />
      </button>

      <div className="mark__body">
        <h1 className="mark__name">Sarah Altheeb</h1>

        <p className="mark__role">
          AI engineer
          <span className="mark__dot" aria-hidden="true" />
          Computer vision
          <span className="mark__dot" aria-hidden="true" />
          Generative AI
          <span className="mark__dot" aria-hidden="true" />
          MLOps
        </p>

        <p className="mark__place">
          <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
            <path
              d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            />
            <circle cx="12" cy="9" r="2.4" fill="currentColor" />
          </svg>
          Eastern Province, Saudi Arabia
        </p>
      </div>

      {/* Runs out of the block and stops — a drawing's leader line. */}
      <span className="mark__rule" aria-hidden="true" />
    </div>
  )
}
