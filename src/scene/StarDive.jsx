import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import * as THREE from 'three'
import { approach } from './approach'
import { framing, OVERVIEW_TARGET } from './framing'
import { orbitClock } from './orbitClock'
import { useNavigationStore } from '../state/navigationStore'
import { useReducedMotion } from './useReducedMotion'

// -----------------------------------------------------------------------------
// Falling into the star, and bursting back out of it.
//
// THE DIVE (stage: 'diving')
// The camera accelerates toward the photosphere on a `power2.in` curve, which
// is the whole trick — constant speed reads as a dolly, acceleration reads as
// FALLING. It stops at 2.62 units, fractionally outside the 2.4-radius
// photosphere. At that distance the star's angular radius is asin(2.4/2.62) ≈
// 66°, against a half-FOV of 23°: the photosphere completely fills the frame,
// so the last thing seen is nothing but churning starfire.
//
// Why stop outside rather than pass through: the photosphere is a front-side
// mesh, so from inside it the faces are culled and the star simply vanishes,
// dumping the visitor into an empty black sphere. Stopping at the surface, at
// the exact moment the screen is pure white, is what lets the teleport happen
// invisibly — the flash covers the cut, which is the oldest trick in film and
// still the cleanest.
//
// THE RETURN (stage: 'returning')
// The mirror image. The wormhole ramps to full over ~0.9s while the screen
// blooms white again, and the landing happens under cover of that flash. Both
// directions therefore end on the same white frame, which is what makes them
// feel like one mechanism rather than two effects.
//
// The screen flash itself is DOM — see StarGate. It has to sit above the canvas
// to cover the transition completely, and a full-viewport additive quad inside
// the scene would still be tone-mapped and bloomed on its way out.
// -----------------------------------------------------------------------------

/** Where the dive stops: just outside the 2.4-radius photosphere. */
const DIVE_RADIUS = 2.62

const _dir = new THREE.Vector3()

export default function StarDive() {
  const { camera } = useThree()
  const stage = useNavigationStore((s) => s.stage)
  const enterPrologue = useNavigationStore((s) => s.enterPrologue)
  const enterSystem = useNavigationStore((s) => s.enterSystem)
  const reducedMotion = useReducedMotion()
  const tweenRef = useRef(null)

  // --- The dive -------------------------------------------------------------
  useEffect(() => {
    if (stage !== 'diving') return

    tweenRef.current?.kill()

    // Reduced motion gets the destination without the fall. The flash still
    // runs, so the transition still reads as deliberate rather than as a jump
    // cut — it is just over almost immediately.
    const duration = reducedMotion ? 0.25 : 1.4

    // Dive along the camera's CURRENT direction from the star, so the fall
    // starts from wherever the visitor had orbited to. Diving along a fixed
    // axis would snap the view sideways before moving.
    _dir.copy(camera.position).normalize()
    const target = _dir.multiplyScalar(DIVE_RADIUS)

    const tl = gsap.timeline({ onComplete: enterPrologue })
    tweenRef.current = tl

    tl.to(
      camera.position,
      {
        x: target.x,
        y: target.y,
        z: target.z,
        duration,
        // Accelerating: falling, not travelling.
        ease: 'power2.in',
      },
      0
    )
    // Bring the system to a halt as the star swallows the frame — the same
    // deceleration the focus flights use, so the language is consistent.
    tl.to(orbitClock, { scale: 0, duration: duration * 0.8 }, 0)

    return () => tl.kill()
  }, [stage, camera, enterPrologue, reducedMotion])

  // --- The return -----------------------------------------------------------
  useEffect(() => {
    if (stage !== 'returning') return

    tweenRef.current?.kill()
    const duration = reducedMotion ? 0.2 : 0.95

    // Drive the wormhole to full independently of scroll. Scrolling produced
    // the approach TO this moment; the burst itself must be a fixed, authored
    // length so it plays identically whether the visitor crept to the bottom
    // or flung the scrollbar there.
    const tl = gsap.timeline({
      onComplete: () => {
        // Land the camera BEFORE handing control back.
        //
        // The story is read from ~96 units out in a far pocket of the shell.
        // OrbitControls mounts the instant the stage becomes 'system' and
        // clamps the camera to maxDistance (~42) on its very first update, so
        // without this the visitor would watch the camera get yanked in from
        // the middle of nowhere. Placing it here means the move happens on the
        // frame where the screen is pure white, and is never seen.
        camera.position.copy(framing.position)
        camera.lookAt(OVERVIEW_TARGET)
        camera.rotation.z = 0

        // The dive froze the orbits so the system held still while the story
        // was being read. Coming back has to start them turning again, or the
        // visitor lands in a dead, motionless system.
        orbitClock.scale = 1

        enterSystem()
      },
    })
    tweenRef.current = tl
    tl.to(approach, { warp: 1, duration: duration * 0.55, ease: 'power2.in' }, 0)

    return () => tl.kill()
  }, [stage, camera, enterSystem, reducedMotion])

  // Once back in the system the wormhole must be gone. Scroll no longer writes
  // `warp` at this point, so it needs releasing here or the streaks would hang
  // in the sky forever.
  useFrame((_, delta) => {
    if (stage !== 'system') return
    if (approach.warp > 0.001) {
      approach.warp = THREE.MathUtils.damp(approach.warp, 0, 8, delta)
    } else if (approach.warp !== 0) {
      approach.warp = 0
    }
  })

  // Keep the star centred through both transitions. The dive is a straight line
  // toward the origin, so this only ever removes drift.
  useFrame(() => {
    if (stage === 'diving') camera.lookAt(0, 0, 0)
  })

  return null
}
