import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// -----------------------------------------------------------------------------
// Ionised dust drifting between the orbits.
//
// This replaces drei's <Sparkles>, which rendered each particle as a visible
// dark quad — the "black transparent box behind every particle" in the bug
// report. That artefact happens when point sprites are drawn with NORMAL alpha
// blending: the transparent corners of each quad still composite their (black)
// colour, and because the points are sorted against each other the boxes stack
// into visible squares.
//
// The fix is ADDITIVE blending, where black is mathematically identical to
// fully transparent (dst + 0 = dst), so a quad's corners simply cannot darken
// anything behind them. With depthWrite off there is also nothing to sort, so
// the artefact cannot reappear at any angle.
//
// One BufferGeometry, one draw call, no per-frame allocation: the drift is done
// entirely on the GPU from a static seed attribute.
// -----------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uPointer;     // pointer position, in this object's local space
  uniform float uRadius;     // radius of influence around the pointer
  uniform float uPush;       // how far particles are displaced
  attribute float aScale;
  attribute vec3 aSeed;
  varying float vFade;
  varying float vHot;

  void main() {
    vec3 p = position;

    // Slow, non-uniform drift. Each particle gets its own phase from its seed,
    // so the field breathes instead of translating as a block.
    p.x += sin(uTime * 0.13 + aSeed.x * 6.28) * 1.6;
    p.y += sin(uTime * 0.09 + aSeed.y * 6.28) * 1.1;
    p.z += cos(uTime * 0.11 + aSeed.z * 6.28) * 1.6;

    // --- Pointer interaction ------------------------------------------------
    // Dust is displaced away from the cursor and swirls around it, so moving
    // the pointer through the field parts it like disturbing suspended
    // particulate. The influence is a smooth falloff, so there is no visible
    // boundary to the affected region.
    vec3 toP = p - uPointer;
    float d = length(toP);
    float infl = smoothstep(uRadius, 0.0, d);
    vec3 dir = toP / max(d, 0.0001);

    // Push outward...
    p += dir * infl * uPush;
    // ...plus a tangential swirl so the motion curls rather than just repelling.
    // Pick a cross-product axis that is never parallel to dir: crossing two
    // parallel vectors yields zero, and normalize(0) is NaN — which would
    // silently blank out every particle directly above or below the cursor.
    vec3 axis = abs(dir.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 swirl = normalize(cross(dir, axis));
    p += swirl * infl * uPush * 0.65;

    vHot = infl;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);

    // Twinkle, and fade out the ones nearest the camera so particles never
    // smear across the lens.
    float twinkle = 0.55 + 0.45 * sin(uTime * 1.7 + aSeed.x * 12.0);
    float dist = -mv.z;
    vFade = twinkle * smoothstep(3.0, 12.0, dist) * smoothstep(150.0, 60.0, dist);

    gl_Position = projectionMatrix * mv;
    // Perspective-correct size; agitated dust also flares slightly larger.
    gl_PointSize = uSize * aScale * (1.0 + infl * 1.1) * uPixelRatio * (18.0 / max(dist, 0.001));
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHotColor;
  varying float vFade;
  varying float vHot;

  void main() {
    // Radial falloff computed procedurally — no texture, no alpha-test, and no
    // opaque quad corners to leave a box behind.
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float glow = pow(core, 3.0);

    float a = (core * 0.35 + glow) * vFade * (1.0 + vHot * 1.4);
    if (a < 0.002) discard;

    // Dust near the pointer takes on the accent colour — the interaction reads
    // even when a particle's displacement is small.
    vec3 col = mix(uColor, uHotColor, vHot);
    gl_FragColor = vec4(col * a, a);
  }
`

// Module-scoped scratch vectors — the pointer projection runs every frame and
// must not allocate.
const _ray = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _target = new THREE.Vector3()

export default function DustField({
  count = 220,
  extent = [48, 24, 48],
  color = '#cfe2ff',
  size = 9,
}) {
  const matRef = useRef()
  const pointsRef = useRef()

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count * 3)
    const scale = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * extent[0]
      pos[i * 3 + 1] = (Math.random() - 0.5) * extent[1]
      pos[i * 3 + 2] = (Math.random() - 0.5) * extent[2]
      seed[i * 3 + 0] = Math.random()
      seed[i * 3 + 1] = Math.random()
      seed[i * 3 + 2] = Math.random()
      // Long tail of small motes with a few bright ones.
      scale[i] = 0.35 + Math.pow(Math.random(), 2.2) * 1.5
    }

    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3))
    g.setAttribute('aScale', new THREE.BufferAttribute(scale, 1))
    // Static field — skip the per-frame bounding-sphere work.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.max(...extent))
    return g
  }, [count, extent])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: size },
      uColor: { value: new THREE.Color(color) },
      uHotColor: { value: new THREE.Color('#a99cff') },
      uPointer: { value: new THREE.Vector3(1e6, 1e6, 1e6) },
      uRadius: { value: 9 },
      uPush: { value: 2.6 },
      uPixelRatio: { value: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2) },
    }),
    [size, color]
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime

    const pts = pointsRef.current
    if (!pts) return

    // Cast the pointer into the scene and place the interaction point at the
    // camera's own distance from the origin — i.e. roughly on the plane the
    // orbital system occupies, which is where the dust the user can see lives.
    _ray.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
    _dir.copy(_ray).sub(state.camera.position).normalize()
    _target
      .copy(state.camera.position)
      .addScaledVector(_dir, state.camera.position.length())

    // The field sits inside the parallax rig, so its local space is rotated
    // relative to the world. Convert, or the disturbance would track offset
    // from the actual cursor.
    pts.worldToLocal(_target)

    // Ease toward the target so a fast flick drags the disturbance behind the
    // pointer instead of teleporting it.
    uniforms.uPointer.value.lerp(_target, 0.12)
  })

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
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
    </points>
  )
}
