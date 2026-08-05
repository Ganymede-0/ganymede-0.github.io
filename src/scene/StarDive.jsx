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
  const beginEmerge = useNavigationStore((s) => s.beginEmerge)
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
        // Put the camera back AT the photosphere, under cover of the white
        // frame — then let it rise out. The visitor left through the star, so
        // they come back through the star.
        //
        // Teleporting straight to the system framing here (the earlier
        // behaviour) worked, but it made every exit a hard cut: the screen
        // flashed and the system was simply there. Landing at the surface and
        // pulling back turns the return into a reveal, and makes "Skip to the
        // projects" a journey rather than a dismissal.
        _dir.copy(framing.position).normalize()
        camera.position.copy(_dir).multiplyScalar(DIVE_RADIUS)
        camera.lookAt(OVERVIEW_TARGET)
        camera.rotation.z = 0

        // The dive slowed the orbits right down for the story. Bring them back
        // to full speed before the reveal, so the system the visitor rises into
        // is already alive.
        orbitClock.scale = 1
        approach.warp = 0

        beginEmerge()
      },
    })
    tweenRef.current = tl
    tl.to(approach, { warp: 1, duration: duration * 0.55, ease: 'power2.in' }, 0)

    return () => tl.kill()
  }, [stage, camera, beginEmerge, reducedMotion])

  // --- Rising out of the star ----------------------------------------------
  // The camera pulls back from the photosphere to the system framing on a
  // decelerating curve, so the whole system opens out of the light. This is the
  // half of the return the visitor actually watches — the wormhole and the
  // flash are the setup, this is the payoff.
  useEffect(() => {
    if (stage !== 'emerging') return

    tweenRef.current?.kill()
    const duration = reducedMotion ? 0.25 : 1.9

    const tl = gsap.timeline({ onComplete: enterSystem })
    tweenRef.current = tl
    tl.to(
      camera.position,
      {
        x: framing.position.x,
        y: framing.position.y,
        z: framing.position.z,
        duration,
        // Decelerating: rushing away from the star, then settling into frame.
        ease: 'power3.out',
      },
      0
    )

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

  // Keep the star centred through both transitions. GSAP is tweening position
  // only; without re-aiming every frame the view would drift off the star as it
  // travels, and the emergence would arrive pointing at empty space.
  useFrame(() => {
    if (stage === 'diving' || stage === 'emerging') camera.lookAt(OVERVIEW_TARGET)
  })

  return null
}
