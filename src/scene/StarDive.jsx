import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import * as THREE from 'three'
import { warp } from './warp'
import { framing, OVERVIEW_TARGET } from './framing'
import { orbitClock } from './orbitClock'
import { useNavigationStore } from '../state/navigationStore'
import { useReducedMotion } from './useReducedMotion'

// -----------------------------------------------------------------------------
// The warp into the star, and the rise back out of it.
//
// THE DIVE (stage: 'diving')
// The camera accelerates toward the photosphere on a `power2.in` curve, which
// is the whole trick — constant speed reads as a dolly, acceleration reads as
// FALLING. At the same time the wormhole's streaks swell from nothing to full,
// so the fall reads as a jump to lightspeed rather than a zoom.
//
// It stops at 2.62 units, fractionally outside the 2.4-radius photosphere. At
// that distance the star's angular radius is asin(2.4/2.62) ≈ 66°, against a
// half-FOV of 23°: the photosphere completely fills the frame, so the last thing
// seen is nothing but churning starfire — and then white (see StarGate), under
// which the CV opens.
//
// Why stop outside rather than pass through: the photosphere is a front-side
// mesh, so from inside it the faces are culled and the star simply vanishes,
// dumping the visitor into an empty black sphere.
//
// THE RETURN (stage: 'emerging')
// "Back to orbit" pulls the camera back from the photosphere to the system
// framing on a decelerating curve, while the orbits spin back up to speed — the
// system opens out of the light rather than cutting back in.
// -----------------------------------------------------------------------------

/** Where the dive stops: just outside the 2.4-radius photosphere. */
const DIVE_RADIUS = 2.62

/** Dive length. The partner of the StarGate `--in` animation — keep in step. */
const DIVE_SECONDS = 1.4

const _dir = new THREE.Vector3()

export default function StarDive() {
  const { camera } = useThree()
  const stage = useNavigationStore((s) => s.stage)
  const enterCv = useNavigationStore((s) => s.enterCv)
  const landInSystem = useNavigationStore((s) => s.landInSystem)
  const reducedMotion = useReducedMotion()
  const tweenRef = useRef(null)

  // --- The dive -------------------------------------------------------------
  useEffect(() => {
    if (stage !== 'diving') return

    tweenRef.current?.kill()

    // Reduced motion gets the destination without the fall. The flash still
    // runs, so the transition still reads as deliberate rather than as a jump
    // cut — it is just over almost immediately.
    const duration = reducedMotion ? 0.25 : DIVE_SECONDS

    // Dive along the camera's CURRENT direction from the star, so the fall
    // starts from wherever the visitor had orbited to. Diving along a fixed
    // axis would snap the view sideways before moving.
    _dir.copy(camera.position).normalize()
    const target = _dir.multiplyScalar(DIVE_RADIUS)

    const tl = gsap.timeline({
      onComplete: () => {
        // The screen is pure white at this instant. Drop the streaks here, under
        // cover of the light, so the CV is never revealed with the tunnel still
        // raging behind it.
        warp.level = 0
        enterCv()
      },
    })
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
    // The streaks build with the fall, and hardest at the end — quadratic, so
    // the first half is a calm drift of light and the last half is the jump.
    tl.to(warp, { level: 1, duration, ease: 'power2.in' }, 0)
    // Bring the system to a halt as the star swallows the frame — the same
    // deceleration the focus flights use, so the language is consistent.
    tl.to(orbitClock, { scale: 0, duration: duration * 0.8 }, 0)

    return () => tl.kill()
  }, [stage, camera, enterCv, reducedMotion])

  // --- Rising out of the star ----------------------------------------------
  useEffect(() => {
    if (stage !== 'emerging') return

    tweenRef.current?.kill()
    const duration = reducedMotion ? 0.25 : 1.9

    // If the camera is not actually at the star (a resize, or an interrupted
    // dive), start the rise from the surface anyway, so the return always reads
    // as coming out of the light.
    if (camera.position.length() > DIVE_RADIUS * 1.5) {
      _dir.copy(framing.position).normalize()
      camera.position.copy(_dir).multiplyScalar(DIVE_RADIUS)
    }
    warp.level = 0

    const tl = gsap.timeline({ onComplete: landInSystem })
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
    // The orbits spin back up as the system comes into view, so the visitor
    // rises into a system that is already alive.
    tl.to(orbitClock, { scale: 1, duration: duration * 1.1, ease: 'power2.out' }, 0)

    return () => tl.kill()
  }, [stage, camera, landInSystem, reducedMotion])

  // Keep the star centred through both transitions. GSAP is tweening position
  // only; without re-aiming every frame the view would drift off the star as it
  // travels, and the rise would arrive pointing at empty space.
  useFrame(() => {
    if (stage === 'diving' || stage === 'emerging') camera.lookAt(OVERVIEW_TARGET)
  })

  return null
}
