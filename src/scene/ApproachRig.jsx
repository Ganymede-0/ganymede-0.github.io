import { useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { approach, easeApproach } from './approach'
import { framing } from './framing'
import { useNavigationStore } from '../state/navigationStore'

// -----------------------------------------------------------------------------
// The approach flight.
//
// While the prologue is on screen, this owns the camera outright: scroll
// position is the only input, and the camera is recomputed from it every frame.
// Nothing tweens and nothing is stateful, which is the whole point — the flight
// is a pure function of scroll, so it scrubs perfectly in both directions. A
// timeline-based intro would only play forwards and would break the moment
// someone scrolled back up to re-read a line.
//
// THE SHAPE OF THE FLIGHT
// The camera starts far out and almost edge-on to the orbital plane, so the
// system first reads as a thin bright line — an object seen from interstellar
// distance. As the visitor scrolls it closes distance and rises toward the
// final three-quarter framing, opening the plane out into the full system. It
// finishes exactly at `framing.position`, so the handover to OrbitControls on
// arrival has no visible jump.
//
// Distance is expressed as a MULTIPLE of the responsive framing distance rather
// than in absolute units, so the flight is automatically correct on a phone and
// on an ultrawide — both of which need very different final distances.
// -----------------------------------------------------------------------------

const UP = new THREE.Vector3(0, 1, 0)
const _dir = new THREE.Vector3()

/** How much further out the flight begins, as a multiple of final distance. */
const START_DISTANCE_MULTIPLE = 7.5
/** Vertical flattening at the start: 0.12 = almost exactly edge-on. */
const START_FLATTEN = 0.12
/** Azimuth swept during the approach, radians. */
const START_AZIMUTH = 1.15

export default function ApproachRig() {
  const { camera } = useThree()
  const stage = useNavigationStore((s) => s.stage)

  // `active` is read by CameraRig and Wormhole from the module object rather
  // than from the store, so neither has to re-render to find out.
  useEffect(() => {
    approach.active = stage === 'prologue'
  }, [stage])

  useFrame(() => {
    if (!approach.active) return

    const p = easeApproach(approach.progress)
    approach.eased = p

    const distance = THREE.MathUtils.lerp(
      framing.distance * START_DISTANCE_MULTIPLE,
      framing.distance,
      p
    )

    // Start edge-on, rise to the framing elevation.
    _dir.copy(framing.position).normalize()
    _dir.y *= THREE.MathUtils.lerp(START_FLATTEN, 1, p)
    _dir.normalize()

    // Sweep around the system as it grows, so the approach has parallax rather
    // than being a straight dolly down one axis.
    _dir.applyAxisAngle(UP, (1 - p) * START_AZIMUTH)

    camera.position.copy(_dir).multiplyScalar(distance)
    camera.lookAt(0, 0, 0)

    // A slow roll through the wormhole. Applied after lookAt, which resets
    // orientation. It peaks mid-warp and returns to level on arrival, so the
    // horizon is straight the instant the visitor takes control.
    if (approach.warp > 0.001) {
      camera.rotateZ(Math.sin(approach.warp * Math.PI) * 0.22)
    }
  })

  return null
}
