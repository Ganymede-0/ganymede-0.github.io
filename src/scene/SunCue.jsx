import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useNavigationStore } from '../state/navigationStore'
import { useReducedMotion } from './useReducedMotion'

// -----------------------------------------------------------------------------
// THE CUE — three chevrons that point at the star. No words anywhere.
//
// WHAT REPLACED WHAT
// A sign reading "Start Here" used to stand behind the star. It worked, and it
// was also the loudest thing in the frame: twenty-six units of lettering across
// the middle of a composition whose subject is a solar system. This says the
// same thing in about a square centimetre of screen, in a language that needs
// no translation and no font.
//
// WHY CHEVRONS, AND WHY THREE
// One arrow is a label. Three stacked chevrons lit in sequence are a MOTION —
// the eye follows the light down the stack and arrives at the star, which is
// exactly the journey the visitor is being invited to make. It is the oldest
// "this way" in interface design, and it survives having its text removed
// because there was never any text in it.
//
// Deliberately not a ring, a halo or a pulsing circle. The scene already draws
// four orbit rings; a fifth circle centred on the star would have read as one
// more orbit and dissolved into the system instead of standing out from it.
//
// POINTING IS COMPUTED, NOT POSED
// The stack floats above the star and turns to face the camera, so it never
// foreshortens into a sliver. Facing the camera is not enough on its own: from
// a low angle the star can project ABOVE the cue on screen, and a posed arrow
// would then point away from the thing it advertises. So every frame it
// projects both the star and itself into screen space and rotates to the angle
// between them. The chevrons point at the star from every camera position there
// is, including the ones nobody will ever use.
//
// THE HIT AREA IS THE INK
// The chevrons take a click and warp to the CV, and hovering them lights the
// star itself — which is the whole lesson: this points at that, and that is the
// door. Because the geometry is the chevrons and nothing else, the target is
// exactly the ink: there is no invisible quad of empty space around it to
// swallow clicks aimed at the sky. The old sign needed a per-pixel alpha test
// to achieve exactly this; a shape made only of what you can see gets it free.
// -----------------------------------------------------------------------------

/** How far above the star's centre the stack floats.
 *
 *  This is a SCREEN-space decision, not a world-space one. The camera looks
 *  down on the system from above, so the far half of every orbit projects into
 *  a band above the star — and the first version of this mark, at 4.15, landed
 *  squarely in it and collided with a planet's label twice a minute. Projected
 *  height is (y - 11) / 27 in normalised units from the resting camera: the
 *  outermost orbit's far side sits at -0.27, the star's own top edge at -0.32,
 *  and this height puts the mark at -0.18 — above everything the system can
 *  throw up there, with room to spare on a phone's tighter framing too. */
const HEIGHT = 6.2

/** One chevron: half-width, rise, stroke thickness. Small — the whole stack is
 *  about a unit tall against a star nearly five across. */
const W = 0.46
const H = 0.34
const T = 0.07

/** The inner edge is trimmed back by this much at each end, tapering the arms
 *  to points instead of cutting them off square. It is the one detail that
 *  makes the mark look drawn rather than extruded. */
const TAPER = 0.075

/** Gap between chevrons, and how much each one grows as the stack rises. The
 *  growth is what stops three identical marks reading as a stutter. */
const GAP = 0.3
const GROWTH = 0.13

/** Resting opacity, innermost first. Brightest nearest the star: at rest the
 *  stack already leans that way, before any animation runs. */
const REST = [0.5, 0.36, 0.24]

/** Warm at the bottom, cool at the top, as though the star's light is catching
 *  the nearest one. The same journey the interface makes: amber to violet. */
const TINT = ['#ffe3bb', '#e8e6ff', '#cfd4ff']

/** Seconds for the light to travel the stack once, and the delay between
 *  neighbours as it passes. */
const WAVE_SECONDS = 2.9
const STAGGER = 0.11

/** Width of the travelling highlight, as a fraction of the wave. Narrow enough
 *  to read as one moving light rather than as three things breathing. */
const PULSE_WIDTH = 0.12
const PULSE_GAIN = 0.55

/** How far a chevron slides toward the star as its light peaks. Tiny: this is
 *  a lean, not a jump. */
const PULSE_SLIDE = 0.055

/** Extra brightness and extra lean while the star is hovered. The mark reacts
 *  to its own target, which ties the two together without a word. */
const HOVER_GAIN = 0.42
const HOVER_SLIDE = 0.1

/** Where each chevron sits in the stack, innermost first. Accumulated rather
 *  than typed, so the spacing opens up in step with the growth. */
const OFFSETS = REST.reduce((acc, _, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + GAP * (1 + i * GROWTH))
  return acc
}, [])

/** The camera's resting distance on a desktop. The mark is scaled against this
 *  so it holds a constant SIZE ON SCREEN rather than a constant size in the
 *  world: a phone has to pull the camera back to fit the same system into a
 *  narrower frame, and at a fixed world size the mark shrank with everything
 *  else until it was a smudge. It is interface, not scenery — the floating
 *  labels hold their size for exactly the same reason. Clamped at both ends so
 *  neither a hard zoom-in nor a zoom-out can distort it. */
const REFERENCE_DISTANCE = 29.2
const SCALE_MIN = 0.85
const SCALE_MAX = 1.8

const _sun = new THREE.Vector3()
const _self = new THREE.Vector3()

/** A chevron outline: down the outer edge to the tip, back along the inner one.
 *  Six points, one closed polygon, no holes. */
function chevronGeometry(scale) {
  const w = W * scale
  const h = H * scale
  const t = T * scale
  const taper = TAPER * scale

  const s = new THREE.Shape()
  s.moveTo(-w, h) // outer edge, left end
  s.lineTo(0, 0) // the tip — the end that points at the star
  s.lineTo(w, h) // outer edge, right end
  s.lineTo(w - taper, h + t) // and back along the inside
  s.lineTo(0, t)
  s.lineTo(-(w - taper), h + t)
  s.closePath()

  return new THREE.ShapeGeometry(s, 1)
}

/** A smooth peak at u = 0 that wraps: the highlight leaves the top of the stack
 *  and reappears at the bottom without a seam. */
function pulseAt(u, width) {
  const d = u > 0.5 ? u - 1 : u
  return Math.exp(-(d * d) / (width * width))
}

export default function SunCue({ onStart, onHover }) {
  const groupRef = useRef()
  const armRefs = useRef([])
  const matRefs = useRef([])

  const stage = useNavigationStore((s) => s.stage)
  const view = useNavigationStore((s) => s.view)
  const cvOpen = useNavigationStore((s) => s.cvOpen)
  const dossierOpen = useNavigationStore((s) => s.dossierOpen)
  const hovered = useNavigationStore((s) => s.sunHovered)
  const reducedMotion = useReducedMotion()

  const geometries = useMemo(() => REST.map((_, i) => chevronGeometry(1 + i * GROWTH)), [])
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries])

  // Only in the resting overview. It is an invitation into the CV, so it has no
  // business on screen behind the CV, behind a project, or during the warp.
  const shown = stage === 'system' && view === 'overview' && !cvOpen && !dossierOpen

  const master = useRef(0)
  const hoverAmt = useRef(0)

  useFrame((state, delta) => {
    const g = groupRef.current
    if (!g) return

    // --- fade the whole mark in and out --------------------------------------
    master.current = THREE.MathUtils.damp(
      master.current,
      shown ? 1 : 0,
      shown ? 3.2 : 7,
      delta
    )
    const visible = master.current > 0.004
    if (g.visible !== visible) g.visible = visible
    if (!visible) return

    hoverAmt.current = THREE.MathUtils.damp(hoverAmt.current, hovered ? 1 : 0, 9, delta)

    // --- hold its size on screen ---------------------------------------------
    const dist = state.camera.position.length()
    g.scale.setScalar(
      THREE.MathUtils.clamp(dist / REFERENCE_DISTANCE, SCALE_MIN, SCALE_MAX)
    )

    // --- face the camera, then aim at the star -------------------------------
    // Billboarding alone would leave the chevrons pointing screen-down, which is
    // only correct while the star happens to be below them on screen. Projecting
    // both points and rotating by the angle between them is correct always.
    g.quaternion.copy(state.camera.quaternion)

    _sun.set(0, 0, 0).project(state.camera)
    _self.copy(g.position).project(state.camera)
    // NDC is normalised per axis, so x has to be scaled by the aspect ratio to
    // recover a true screen-space direction; the object's own local axes carry
    // no such distortion.
    const aspect = state.size.width / Math.max(1, state.size.height)
    const dx = (_sun.x - _self.x) * aspect
    const dy = _sun.y - _self.y
    // The chevrons point along local -Y. A rotation of θ about Z carries -Y to
    // (sin θ, -cos θ), so aiming that at (dx, dy) means θ = atan2(dx, -dy).
    if (dx !== 0 || dy !== 0) g.rotateZ(Math.atan2(dx, -dy))

    // --- run the light down the stack ----------------------------------------
    const phase = reducedMotion ? 0 : (state.clock.elapsedTime / WAVE_SECONDS) % 1

    for (let i = 0; i < REST.length; i++) {
      const mat = matRefs.current[i]
      const arm = armRefs.current[i]
      if (!mat || !arm) continue

      // The outermost chevron peaks first and the innermost last, so the light
      // travels toward the star rather than away from it.
      const u = reducedMotion
        ? 0
        : (((phase - (REST.length - 1 - i) * STAGGER) % 1) + 1) % 1
      const pulse = reducedMotion ? 0 : pulseAt(u, PULSE_WIDTH)

      const lean = pulse * PULSE_SLIDE + hoverAmt.current * HOVER_SLIDE
      arm.position.set(0, OFFSETS[i] - lean, 0)

      mat.opacity =
        master.current *
        Math.min(1, REST[i] + pulse * PULSE_GAIN + hoverAmt.current * HOVER_GAIN)
    }
  })

  return (
    <group ref={groupRef} position={[0, HEIGHT, 0]} visible={false}>
      {REST.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            armRefs.current[i] = el
          }}
          geometry={geometries[i]}
          position={[0, OFFSETS[i], 0]}
          renderOrder={4}
          onClick={(e) => {
            e.stopPropagation()
            onStart?.()
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            document.body.classList.add('is-pointing')
            // Lighting the STAR from here is the point: hovering the pointer
            // shows you what it is pointing at.
            onHover?.(true)
          }}
          onPointerOut={() => {
            document.body.classList.remove('is-pointing')
            onHover?.(false)
          }}
        >
          <meshBasicMaterial
            ref={(el) => {
              matRefs.current[i] = el
            }}
            color={TINT[i]}
            transparent
            opacity={0}
            depthWrite={false}
            /* Additive, like everything else here that is made of light: the
               nebula and the corona read through the mark instead of being
               covered by it, which is why something this bright can sit over
               the star without ever looking pasted on top of it. */
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            fog={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}
