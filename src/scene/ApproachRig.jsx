import { useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  approach,
  easeApproach,
  PROLOGUE_RADIUS,
  PROLOGUE_DRIFT,
  PROLOGUE_ORBIT_SCALE,
} from './approach'
import { orbitClock } from './orbitClock'
import { framing } from './framing'
import { useNavigationStore } from '../state/navigationStore'

// -----------------------------------------------------------------------------
// The camera while the story is being read.
//
// WHERE THIS IS
// A long way out, but still looking back at the system. The visitor fell into
// the star and came out here — see PROLOGUE_RADIUS in approach.js for the
// geometry, and for why the previous version's position produced a black disc
// in the middle of the frame.
//
// THE SYSTEM STAYS IN VIEW, AND STAYS ALIVE
// The orbits keep turning at PROLOGUE_ORBIT_SCALE, and the camera holds the
// system in frame — pushed off to one side so it never sits under the reading
// column. That distant, slowly-turning system is the entire reason the story
// space feels like somewhere rather than a backdrop: it gives the text a
// horizon, and it quietly reminds the reader what they are about to go back to.
//
// The camera also drifts continuously on a clock, not only on scroll. A camera
// that moves ONLY when you scroll makes the world feel frozen the instant you
// stop to read a paragraph — which is most of the time. The scroll-driven part
// is still a pure function of scroll, so the flight scrubs exactly; the clock
// term rides on top and simply never stops.
// -----------------------------------------------------------------------------

const UP = new THREE.Vector3(0, 1, 0)
const ORIGIN = new THREE.Vector3(0, 0, 0)
const _pos = new THREE.Vector3()
const _right = new THREE.Vector3()
const _look = new THREE.Vector3()

/** Where in the shell the story is read from. */
const ANCHOR = new THREE.Vector3(0.42, 0.24, 0.87).normalize()

export default function ApproachRig() {
  const { camera } = useThree()
  const stage = useNavigationStore((s) => s.stage)

  // Read from the module object by CameraRig and Wormhole, so neither has to
  // re-render to find out who owns the camera.
  useEffect(() => {
    approach.active = stage === 'prologue'
  }, [stage])

  // Slow the orbits for the read, rather than leaving them stopped where the
  // dive left them.
  useEffect(() => {
    if (stage !== 'prologue') return
    orbitClock.scale = PROLOGUE_ORBIT_SCALE
  }, [stage])

  useFrame((state) => {
    if (!approach.active) return

    const p = easeApproach(approach.progress)
    approach.eased = p

    // Scroll term: a shallow swing plus a gentle closing of distance.
    // Clock term: a continuous crawl that never stops, so the sky always has
    // life in it even while the visitor sits still and reads.
    const angle = (p - 0.5) * 0.34 + state.clock.elapsedTime * 0.0075

    _pos
      .copy(ANCHOR)
      .applyAxisAngle(UP, angle)
      .multiplyScalar(PROLOGUE_RADIUS - p * PROLOGUE_DRIFT)
    _pos.y += (p - 0.5) * 9

    camera.position.copy(_pos)

    // Aim at the system first, then slide the aim sideways so the system sits
    // OFF the reading column rather than behind it.
    //
    // Aiming to the LEFT of the star pushes the star to the RIGHT of frame,
    // which is the half of the screen the prose does not occupy. On the compact
    // layout the text spans the full width, so the offset drops to near nothing
    // and the system simply sits high and small instead.
    camera.lookAt(ORIGIN)
    _right.setFromMatrixColumn(camera.matrixWorld, 0)

    const offset = framing.compact ? 0.04 : 0.17
    _look.copy(ORIGIN).addScaledVector(_right, -offset * PROLOGUE_RADIUS)
    // Lift the aim slightly so the system rides above centre, clear of the
    // lower third where the scroll cue and skip control live.
    _look.y += framing.compact ? 10 : 5

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
