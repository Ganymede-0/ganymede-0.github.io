import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { approach } from './approach'

// -----------------------------------------------------------------------------
// The wormhole — the transition from the approach sequence into the system.
//
// Built as real geometry travelling past the camera rather than a screen-space
// post effect, for two reasons. First, the existing post chain is deliberately
// fixed in shape (adding or removing an effect at runtime recompiles the whole
// composer and visibly shifts the scene's exposure — the cause of an earlier
// lighting bug). Second, real streaks sit correctly in the scene: they are
// bloomed by the existing Bloom pass and occluded by nothing, so they read as
// part of the same world rather than a filter laid over it.
//
// Each streak is a two-vertex line whose tail is offset backwards along the
// travel axis. At rest the tail length is ~0, so a streak is a point; as warp
// ramps it elongates into a motion trail. This is the same trick a camera does
// with a slow shutter, and it is why the effect reads as speed rather than as
// "lines appeared".
//
// Everything is driven from `approach.warp`, which is a pure function of scroll
// position — so scrolling back up genuinely reverses the wormhole rather than
// replaying it.
// -----------------------------------------------------------------------------

const DEPTH = 80

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uWarp;
  attribute float aSide;    // 0 = head of the streak, 1 = tail
  attribute float aSpeed;
  varying float vAlpha;
  varying float vSide;

  void main() {
    vec3 p = position;

    // Travel toward the camera. The camera looks down -Z in its own space, so
    // "approaching" means z rising toward 0. mod() recycles a streak back to
    // the far plane instead of allocating new ones.
    float speed = aSpeed * (6.0 + uWarp * 240.0);
    float z = mod(p.z + uTime * speed, ${DEPTH.toFixed(1)}) - ${DEPTH.toFixed(1)};

    // Tail trails behind the direction of travel. Quadratic in warp so the
    // streaks stay tight until the wormhole is genuinely underway.
    float len = (0.35 + uWarp * uWarp * 26.0) * aSpeed;
    p.z = z - aSide * len;

    // Fade in from the far plane and out as a streak sweeps past the lens, so
    // nothing pops into or out of existence.
    float fadeFar = smoothstep(-${DEPTH.toFixed(1)}, -${(DEPTH * 0.55).toFixed(1)}, p.z);
    float fadeNear = smoothstep(-1.2, -7.0, p.z);
    vAlpha = fadeFar * fadeNear * uWarp;
    vSide = aSide;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHot;
  varying float vAlpha;
  varying float vSide;

  void main() {
    // The head of a streak is hot and near-white; the tail cools into the
    // scene's violet accent and falls off. Without this gradient the streaks
    // read as flat lines rather than as something moving fast.
    float head = 1.0 - vSide;
    vec3 col = mix(uColor, uHot, head * head);
    float a = vAlpha * mix(0.05, 1.0, head);
    if (a < 0.002) discard;
    gl_FragColor = vec4(col * a, a);
  }
`

export default function Wormhole({ count = 900, reducedMotion = false }) {
  const groupRef = useRef()
  const matRef = useRef()

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 2 * 3)
    const side = new Float32Array(count * 2)
    const speed = new Float32Array(count * 2)

    for (let i = 0; i < count; i++) {
      // Distribute across an annulus around the travel axis. sqrt() keeps the
      // areal density even — without it everything crowds the centre.
      const angle = Math.random() * Math.PI * 2
      const radius = 0.6 + Math.sqrt(Math.random()) * 26
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      const z = -Math.random() * DEPTH
      const s = 0.45 + Math.random() * 0.9

      for (let v = 0; v < 2; v++) {
        const o = (i * 2 + v) * 3
        pos[o] = x
        pos[o + 1] = y
        pos[o + 2] = z
        side[i * 2 + v] = v
        speed[i * 2 + v] = s
      }
    }

    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSide', new THREE.BufferAttribute(side, 1))
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
    return g
  }, [count])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWarp: { value: 0 },
      uColor: { value: new THREE.Color('#8b7cff') },
      uHot: { value: new THREE.Color('#eaf0ff') },
    }),
    []
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state, delta) => {
    const g = groupRef.current
    if (!g) return

    // Ride with the camera so the tunnel is always dead ahead. This mirrors the
    // camera rather than parenting to it, because R3F's default camera is not
    // guaranteed to be part of the scene graph. ApproachRig is mounted before
    // this component, so it has already written the camera for this frame.
    g.position.copy(state.camera.position)
    g.quaternion.copy(state.camera.quaternion)

    uniforms.uTime.value += delta
    // Ease toward the scroll-derived target rather than snapping to it: a
    // trackpad flick produces very coarse scroll deltas, and following them
    // literally makes the streaks stutter.
    const target = approach.active ? approach.warp : 0
    uniforms.uWarp.value = THREE.MathUtils.damp(
      uniforms.uWarp.value,
      reducedMotion ? Math.min(target, 0.25) : target,
      6,
      delta
    )
  })

  return (
    <group ref={groupRef}>
      <lineSegments geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={matRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  )
}
