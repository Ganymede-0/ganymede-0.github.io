import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildShipPath } from './shipPath'
import { framing } from './framing'
import { useNavigationStore } from '../state/navigationStore'

// -----------------------------------------------------------------------------
// THE ROCKET.
//
// SHAPE
// A rocket, not an aircraft: one lathed body running nose to nozzle — ogive
// cone, parallel barrel, a slight flare into the engine skirt — with three
// tail fins at 120 degrees and a flared bell. There are no wings, because a
// vehicle with wings reads as something that flies in air, and nothing here
// has any.
//
// DYNAMIC PERSPECTIVE
// Its size is driven by how far it is from the camera. Projection already
// shrinks distant things, but only in proportion to 1/d, and across this orbit
// that difference is too subtle to feel: the loop runs from roughly 14 units
// away at the near pass to 40 at the far side. So the scale is driven again, on
// top of the projection — near the viewer the rocket swells to nearly three
// times the size it holds out at the sign.
//
// The mapping is built from the path's OWN distance range, sampled once against
// the resting camera, then smoothstepped. That matters for two reasons: the
// curve is closed and the distance along it is continuous, so the scale is
// continuous and seamless at the loop point; and because the range is measured
// rather than assumed, the rocket is always at its smallest exactly where the
// path is furthest away — which is the pass through the sign, where it has to
// fit through a gap.
//
// CATCHING IT
// The visible rocket is roughly forty screen pixels at its smallest, which is
// not a fair click target for something moving. An invisible sphere several
// times its size rides with it and takes the click instead.
// -----------------------------------------------------------------------------

/** Seconds for one complete loop. Slow: this is ambience, not a chase. */
const LOOP_SECONDS = 38

/** Frames precomputed around the loop. */
const FRAMES = 600

/** Size at the far side of the orbit, and at the near pass.
 *
 *  The spread is deliberately wide. Projection alone changes the rocket's size
 *  by the ratio of the distances — roughly two to one across this loop — and
 *  that is too subtle to feel as an approach. Driving the scale as well takes
 *  the swing to about five to one, which is what makes it read as flying AT the
 *  viewer and then away again. */
const SCALE_FAR = 0.5
const SCALE_NEAR = 1.6

const _pos = new THREE.Vector3()
const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _fwd = new THREE.Vector3()

/** Body section, in profile: [radius, z] from nose to nozzle. Lathed about its
 *  axis, so this list IS the silhouette. */
function bodyGeometry() {
  const profile = [
    [0.0, -1.75], // nose tip
    [0.028, -1.68],
    [0.062, -1.56],
    [0.101, -1.4],
    [0.135, -1.2],
    [0.16, -0.98], // shoulder, where the ogive meets the barrel
    [0.173, -0.72],
    [0.178, -0.2],
    [0.178, 0.55], // parallel barrel
    [0.186, 0.82], // flare into the engine skirt
    [0.2, 1.0],
    [0.152, 1.06], // throat
    [0.215, 1.22], // bell
    [0.0, 1.22],
  ]
  const g = new THREE.LatheGeometry(
    profile.map(([r, z]) => new THREE.Vector2(r, z)),
    24
  )
  // Lathe builds around Y; this vehicle travels along Z.
  g.rotateX(Math.PI / 2)
  return g
}

/** One tail fin: a swept trapezoid, thin, raked back from the barrel to past
 *  the nozzle. */
function finGeometry() {
  const s = new THREE.Shape()
  s.moveTo(0.13, 0.36) // root leading edge
  s.lineTo(0.42, 1.02) // tip leading edge
  s.lineTo(0.42, 1.2) // tip trailing
  s.lineTo(0.13, 1.1) // root trailing
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: false })
  g.translate(0, 0, -0.011)
  // Drawn in XY (x = radius out, y = along the body); stand it up so y becomes z.
  g.rotateX(Math.PI / 2)
  return g
}

export default function Rocket({ sign }) {
  const groupRef = useRef()
  const hitRef = useRef()
  const stage = useNavigationStore((s) => s.stage)
  const catchRocket = useNavigationStore((s) => s.catchRocket)
  const view = useNavigationStore((s) => s.view)

  const gate = sign?.gate

  const path = useMemo(() => {
    const curve = buildShipPath(gate)
    if (!curve) return null
    const frames = curve.computeFrenetFrames(FRAMES, true)

    // Measure how far the loop runs from the resting camera, so the scaling
    // below is mapped to the path this rocket actually flies rather than to
    // numbers picked by eye.
    const probe = new THREE.Vector3()
    let dNear = Infinity
    let dFar = -Infinity
    for (let i = 0; i <= 240; i++) {
      curve.getPointAt(i / 240, probe)
      const d = probe.distanceTo(framing.position)
      if (d < dNear) dNear = d
      if (d > dFar) dFar = d
    }

    if (import.meta.env.DEV) {
      console.info(
        '[Rocket] camera distance ' + dNear.toFixed(1) + '-' + dFar.toFixed(1) +
        ', scale ' + SCALE_NEAR + '-' + SCALE_FAR
      )
    }
    return { curve, frames, dNear, dFar }
  }, [gate])

  const geo = useMemo(
    () => ({
      body: bodyGeometry(),
      fin: finGeometry(),
      band: new THREE.TorusGeometry(0.181, 0.014, 8, 24),
      flame: new THREE.ConeGeometry(0.15, 0.85, 12, 1, true),
      hit: new THREE.SphereGeometry(1.15, 8, 6),
    }),
    []
  )
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])

  useFrame((state, delta) => {
    const g = groupRef.current
    if (!g || !path) return

    const visible = stage === 'system'
    if (g.visible !== visible) g.visible = visible
    if (!visible) return

    const t = (state.clock.elapsedTime / LOOP_SECONDS) % 1
    path.curve.getPointAt(t, _pos)
    g.position.copy(_pos)

    // --- size, from distance -------------------------------------------------
    const d = _pos.distanceTo(state.camera.position)
    const span = Math.max(1e-3, path.dFar - path.dNear)
    const raw = THREE.MathUtils.clamp((d - path.dNear) / span, 0, 1)
    const eased = raw * raw * (3 - 2 * raw)
    const scale = THREE.MathUtils.lerp(SCALE_NEAR, SCALE_FAR, eased)
    g.scale.setScalar(scale)

    // --- heading, from the curve's own frame ---------------------------------
    const i = Math.min(FRAMES - 1, Math.floor(t * FRAMES))
    const tangent = path.frames.tangents[i]
    const normal = path.frames.normals[i]
    const binormal = path.frames.binormals[i]
    _fwd.copy(tangent).negate()
    _m.makeBasis(binormal, normal, _fwd)
    _q.setFromRotationMatrix(_m)
    g.quaternion.slerp(_q, 1 - Math.exp(-delta * 10))
  })

  if (!path) return null

  const interactive = view !== 'transitioning'

  return (
    <group ref={groupRef} name="rocket" visible={false}>
      {/* The catch target. Transparent rather than `visible = false`, because an
          invisible object is not a reliable pointer target — this one draws
          nothing and still takes the click. */}
      <mesh
        ref={hitRef}
        geometry={geo.hit}
        onClick={(e) => {
          e.stopPropagation()
          if (interactive) catchRocket()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          if (interactive) document.body.classList.add('is-pointing')
        }}
        onPointerOut={() => document.body.classList.remove('is-pointing')}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Airframe. Light, faintly warm metal — it is lit by a star. */}
      <mesh geometry={geo.body}>
        <meshStandardMaterial
          color="#eef2fb"
          metalness={0.28}
          roughness={0.4}
          emissive="#93a2c8"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* A single livery band, the one piece of colour on the hull. */}
      <mesh geometry={geo.band} position={[0, 0, -0.55]}>
        <meshStandardMaterial
          color="#e4572e"
          metalness={0.2}
          roughness={0.45}
          emissive="#7d2a14"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Three fins at 120 degrees. */}
      {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((a) => (
        <mesh key={a} geometry={geo.fin} rotation={[0, 0, a]}>
          <meshStandardMaterial
            color="#c6d0e6"
            metalness={0.3}
            roughness={0.5}
            emissive="#6b7aa4"
            emissiveIntensity={0.45}
          />
        </mesh>
      ))}

      {/* Exhaust. Additive and un-tone-mapped so the scene's bloom catches it —
          at this size the plume is half of what makes the rocket read. */}
      <mesh geometry={geo.flame} position={[0, 0, 1.62]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial
          color="#9fc4ff"
          toneMapped={false}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
