import { useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { approach, easeApproach, PROLOGUE_RADIUS, PROLOGUE_DRIFT } from './approach'
import { useNavigationStore } from '../state/navigationStore'

// -----------------------------------------------------------------------------
// The camera while the story is being read.
//
// WHERE THIS IS
// Not in the solar system. The visitor fell into the star and came out in a
// pocket of deep space — see PROLOGUE_RADIUS in approach.js for the geometry,
// and for why the previous version's start position produced a black disc in
// the middle of the frame.
//
// WHAT IT DOES
// Almost nothing, deliberately. The camera drifts along a shallow arc and turns
// slowly, so the gas behind the text has parallax and the space feels inhabited
// — but it never travels far and never accelerates. The scroll is carrying a
// résumé; a camera making big moves underneath it competes with the words for
// the same attention and makes reading tiring.
//
// It is still a PURE FUNCTION of scroll, with no timeline and no state, so the
// whole thing scrubs perfectly in both directions. Scrolling back to re-read a
// line rewinds the camera exactly, which a keyframed intro cannot do.
// -----------------------------------------------------------------------------

const UP = new THREE.Vector3(0, 1, 0)
const _pos = new THREE.Vector3()
const _look = new THREE.Vector3()

/** Where in the shell the story sits. Away from the system, deep in gas. */
const ANCHOR = new THREE.Vector3(0.38, 0.16, -0.91).normalize()

export default function ApproachRig() {
  const { camera } = useThree()
  const stage = useNavigationStore((s) => s.stage)

  // Read from the module object by CameraRig and Wormhole, so neither has to
  // re-render to find out who owns the camera.
  useEffect(() => {
    approach.active = stage === 'prologue'
  }, [stage])

  // Entering the story places the camera immediately. This runs while the
  // screen is still white from the dive, so the jump from the photosphere to
  // the far side of the shell is never seen.
  useEffect(() => {
    if (stage !== 'prologue') return
    approach.eased = easeApproach(approach.progress)
  }, [stage])

  useFrame(() => {
    if (!approach.active) return

    const p = easeApproach(approach.progress)
    approach.eased = p

    // A shallow arc: the camera swings through a small angle and rises a
    // little, so the nebula behind the text shears rather than sliding flat.
    const angle = (p - 0.5) * 0.42
    _pos
      .copy(ANCHOR)
      .applyAxisAngle(UP, angle)
      .multiplyScalar(PROLOGUE_RADIUS - p * PROLOGUE_DRIFT)
    _pos.y += (p - 0.5) * 12

    camera.position.copy(_pos)

    // Look along the drift rather than at any particular object — there is
    // nothing out here to look AT, and aiming at the origin would put the
    // distant system dead centre behind every paragraph.
    _look.copy(_pos).multiplyScalar(0.82)
    _look.y -= 6
    camera.lookAt(_look)

    // A slow roll through the wormhole, applied after lookAt (which resets
    // orientation). It peaks mid-warp and returns to level, so the horizon is
    // straight the instant the visitor takes control again.
    if (approach.warp > 0.001) {
      camera.rotateZ(Math.sin(approach.warp * Math.PI) * 0.26)
    }
  })

  return null
}
