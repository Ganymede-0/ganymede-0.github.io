import { Suspense, useRef, useEffect, useMemo, Component } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { orbitClock } from './orbitClock'

// -----------------------------------------------------------------------------
// A rigged character riding one of the orbit rings.
//
// This component is the INTEGRATION, not the asset. Drop a rigged, animated
// .glb at the `url` path and it will ride the ring; everything below — the
// orbital placement, tangent orientation, banking, animation playback and the
// failure handling — is already solved.
//
// HOW THE PLACEMENT WORKS
// The hierarchy mirrors OrbitPath exactly so the character sits ON the drawn
// line rather than near it:
//
//   <group rotation={[tilt, 0, tilt*0.5]}>   ← the orbit plane (matches ring)
//     <group rotation-y={angle}>             ← carries the body around
//       <group position={[radius, 0, 0]}>    ← the body's seat on the ring
//         <group rotation-y={heading}>       ← face along direction of travel
//
// For a point at local (R, 0, 0) spun about Y, the direction of travel is
// local −Z. Three's convention is that an object's "forward" is also −Z, so a
// model authored facing −Z needs no correction. Most exported characters face
// +Z instead — hence `headingOffset`, which is the one dial you may need to
// touch after dropping in a model.
// -----------------------------------------------------------------------------

function SkaterModel({
  url,
  radius,
  tilt,
  speed,
  startAngle,
  scale,
  headingOffset,
  clip,
  lean,
  hoverHeight,
}) {
  const orbitRef = useRef()
  const leanRef = useRef()
  const group = useRef()

  const { scene, animations } = useGLTF(url)
  const { actions, names } = useAnimations(animations, group)

  // Clone so the same file could be mounted more than once without the two
  // instances sharing (and fighting over) one skeleton.
  const model = useMemo(() => scene.clone(true), [scene])

  // Play the requested clip, or the first one the file happens to contain.
  useEffect(() => {
    if (!names.length) return
    const name = clip && actions[clip] ? clip : names[0]
    const action = actions[name]
    if (!action) return
    action.reset().fadeIn(0.4).play()
    return () => action.fadeOut(0.3)
  }, [actions, names, clip])

  // Match the scene's reflection budget so the character doesn't read as if it
  // were lit by a different environment than everything around it.
  useEffect(() => {
    model.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = false
      o.receiveShadow = false
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      mats.forEach((m) => {
        if (m && 'envMapIntensity' in m) m.envMapIntensity = 0.9
      })
    })
  }, [model])

  useFrame(() => {
    // Ride the shared clock, so the character decelerates to a standstill along
    // with the planets when a project is focused.
    const angle = startAngle + orbitClock.elapsed * speed
    if (orbitRef.current) orbitRef.current.rotation.y = angle
    // Bank into the turn — a skater on a circular path leans toward the centre.
    if (leanRef.current) leanRef.current.rotation.z = lean
  })

  return (
    <group rotation={[tilt, 0, tilt * 0.5]}>
      <group ref={orbitRef}>
        <group position={[radius, hoverHeight, 0]}>
          <group ref={leanRef}>
            <group ref={group} rotation={[0, headingOffset, 0]} scale={scale}>
              <primitive object={model} />
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

// A missing or malformed .glb must never take the scene down with it. useGLTF
// throws on a 404, and an uncaught throw inside the Canvas unmounts the whole
// tree — which in this project means a black screen. This boundary degrades a
// bad asset to "no character" and logs once.
class SkaterBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    console.warn(
      '[OrbitSkater] model failed to load — the scene will render without it.',
      error?.message ?? error
    )
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function OrbitSkater({
  url = '/models/skater.glb',
  /** which ring to ride — default sits between Bayan (10.5) and Sharqiyah (13.5) */
  radius = 12,
  tilt = 0.04,
  /** radians per second of orbit clock; negative reverses direction */
  speed = 0.05,
  startAngle = 1.6,
  /** glTF is metres, so a ~1.7 tall human is ~1.7 units — about a planet's size */
  scale = 1,
  /** set to Math.PI if the character skates backwards */
  headingOffset = 0,
  /** name of the animation clip; falls back to the first in the file */
  clip = undefined,
  /** lean into the turn, radians */
  lean = -0.12,
  /** lift off the ring line, e.g. to sit board wheels on it rather than feet */
  hoverHeight = 0,
}) {
  if (!url) return null
  return (
    <SkaterBoundary>
      <Suspense fallback={null}>
        <SkaterModel
          url={url}
          radius={radius}
          tilt={tilt}
          speed={speed}
          startAngle={startAngle}
          scale={scale}
          headingOffset={headingOffset}
          clip={clip}
          lean={lean}
          hoverHeight={hoverHeight}
        />
      </Suspense>
    </SkaterBoundary>
  )
}
