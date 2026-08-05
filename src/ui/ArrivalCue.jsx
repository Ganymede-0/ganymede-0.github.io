import { useEffect, useRef } from 'react'
import { useNavigationStore, useCueVisible } from '../state/navigationStore'

// -----------------------------------------------------------------------------
// The arrival cue — what to do, said once, inside a nebula.
//
// WHAT IT IS FOR
// The failure mode this prevents: a visitor who is not a 3D-web native lands in
// a dark scene of small moving spheres with no obvious verb. One sentence names
// what they are looking at, and then gets out of the way.
//
// It is only a sentence. Nothing here navigates — the CV panel on the left is
// already a complete, keyboard-reachable route to every project, so a second
// menu at the moment of arrival would add nothing and would turn the payoff of
// the wormhole into a dialog box.
//
// WHY THE NEBULA IS GENERATED, NOT DOWNLOADED
// A photographic nebula plate would be a fixed image: it cannot react to the
// pointer, and it would have to be hotlinked (fragile) or bundled (heavy) on a
// site that currently ships no texture files at all. This is built from an SVG
// fractal-noise filter instead, which gives a genuinely fractal silhouette —
// no two edges repeat — for a few hundred bytes, and which responds to input.
//
// THE SHAPE TRICK
// `feTurbulence` generates fractal noise; `feDisplacementMap` then pushes every
// pixel of a soft radial gradient sideways by the amount of noise under it. A
// clean elliptical edge is torn into wisps and filaments. That is the entire
// reason this reads as gas rather than as a blurred rectangle, and it is why
// there is no border or panel anywhere in the markup.
//
// PERFORMANCE
// The filtered layer never moves. Filters re-rasterise whenever the element
// they apply to changes, so animating the filtered node would re-run a
// four-octave turbulence every frame — on top of the six custom shaders already
// running in the scene behind it. All motion lives on separate unfiltered
// layers driven by transform and opacity, which the compositor handles without
// touching the filter at all.
// -----------------------------------------------------------------------------

// Fixed, hand-placed so the field is deterministic — no Math.random during
// render, and the same constellation every time.
const EMBERS = [
  { x: 12, y: 30, d: 0 },
  { x: 24, y: 68, d: 1.4 },
  { x: 38, y: 18, d: 2.9 },
  { x: 52, y: 78, d: 0.7 },
  { x: 66, y: 26, d: 2.1 },
  { x: 78, y: 62, d: 3.4 },
  { x: 88, y: 38, d: 1.1 },
  { x: 46, y: 46, d: 2.5 },
]

export default function ArrivalCue() {
  const dismissOnboarding = useNavigationStore((s) => s.dismissOnboarding)

  const rootRef = useRef(null)

  // Shared with useLabelsVisible, so a body's floating name can never be drawn
  // on top of this — which was the reported overlap.
  const eligible = useCueVisible()

  // Pointer reactivity. Written straight to CSS custom properties on a rAF
  // tick — never through React state, which would re-render this subtree on
  // every mouse move for a purely visual effect.
  useEffect(() => {
    if (!eligible) return
    const el = rootRef.current
    if (!el) return

    let raf = 0
    let px = 0.5
    let py = 0.5
    let tx = 0.5
    let ty = 0.5

    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      // Normalised against the cue's own box, so the light tracks the pointer
      // correctly regardless of where the element sits on screen.
      tx = (e.clientX - r.left) / r.width
      ty = (e.clientY - r.top) / r.height
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const tick = () => {
      raf = 0
      // Ease toward the pointer so the gas has weight — light diffusing
      // through a cloud should lag, not snap.
      px += (tx - px) * 0.09
      py += (ty - py) * 0.09
      el.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`)
      el.style.setProperty('--my', `${(py * 100).toFixed(2)}%`)
      // Keep easing until settled, otherwise the light stops mid-travel
      // whenever the pointer goes still.
      if (Math.abs(tx - px) > 0.001 || Math.abs(ty - py) > 0.001) {
        raf = requestAnimationFrame(tick)
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [eligible])

  if (!eligible) return null

  return (
    <div className="nebula-cue" ref={rootRef} role="region" aria-label="Getting started">
      {/* The filter itself. Zero-sized and hidden — it exists only to be
          referenced by the gas layers below. */}
      <svg className="nebula-cue__defs" aria-hidden="true" focusable="false">
        <defs>
          {/* Two filters at different frequencies: the coarse one carves the
              overall cloud silhouette, the fine one adds filament detail.
              Layering them is what stops the shape reading as one blurred
              blob with a wobbly edge. */}
          <filter id="nebula-coarse" x="-35%" y="-35%" width="170%" height="170%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.009 0.014"
              numOctaves="4"
              seed="11"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="120"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <filter id="nebula-fine" x="-35%" y="-35%" width="170%" height="170%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.03 0.05"
              numOctaves="3"
              seed="4"
              result="noise2"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise2"
              scale="55"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Gas. Static and filtered — see the performance note above. */}
      <div className="nebula-cue__gas nebula-cue__gas--coarse" aria-hidden="true" />
      <div className="nebula-cue__gas nebula-cue__gas--fine" aria-hidden="true" />

      {/* Unfiltered, animated: slow internal drift and the pointer light. */}
      <div className="nebula-cue__drift" aria-hidden="true" />
      <div className="nebula-cue__light" aria-hidden="true" />

      <div className="nebula-cue__embers" aria-hidden="true">
        {EMBERS.map((e, i) => (
          <span
            key={i}
            style={{ left: `${e.x}%`, top: `${e.y}%`, animationDelay: `${e.d}s` }}
          />
        ))}
      </div>

      <div className="nebula-cue__content">
        {/* The message, and nothing else.
            An earlier version listed Raha, Bayan and Sharqiyah as buttons here.
            It worked, but it turned a moment of arrival into a menu — and it
            duplicated navigation the CV panel on the left already provides
            completely and accessibly. One sentence lands harder, and leaves the
            system itself as the thing the visitor looks at next. */}
        <p className="nebula-cue__lead">
          You&rsquo;ve arrived. Each planet is a project.
        </p>

        <button
          type="button"
          className="nebula-cue__dismiss"
          onClick={dismissOnboarding}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
