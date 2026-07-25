import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SIMPLEX_3D } from './glslNoise'

// A vast inward-facing sphere that wraps the whole system in coloured
// interstellar gas. This is what turns the "black void" into deep space: the
// drei <Stars> give you points of light, but the nebula gives the darkness
// between them structure, depth, and colour. Rendered on the far side with no
// depth writes so it always sits behind every body and never occludes anything.
const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vDir;
  uniform float uTime;
  ${SIMPLEX_3D}

  void main() {
    vec3 d = normalize(vDir);

    // Drifting gas, warped so the clouds are wispy rather than blobby.
    // This shader covers EVERY pixel on screen, so its per-fragment cost is the
    // single most expensive thing in the frame. The detail layer is one raw
    // snoise rather than a second fbm — visually near-identical against a
    // backdrop this dim, at two-thirds the noise evaluations.
    float base = fbm(d * 2.2 + vec3(0.0, uTime * 0.006, 0.0));
    float warp = snoise(d * 5.0 + base * 1.5 + 12.0);
    float clouds = smoothstep(0.05, 0.75, base * 0.6 + warp * 0.4);

    vec3 col = vec3(0.015, 0.02, 0.04);            // deep space floor
    col += vec3(0.10, 0.05, 0.19) * clouds;        // violet body
    col += vec3(0.0, 0.14, 0.17) * pow(clouds, 2.0) * 0.7;  // teal cores
    col += vec3(0.20, 0.11, 0.03) * pow(max(warp, 0.0), 3.0) * 0.5; // amber wisps

    // A faint denser lane through the middle, like a galactic plane.
    float lane = smoothstep(0.35, 0.0, abs(d.y)) * 0.12;
    col += vec3(0.09, 0.10, 0.16) * lane;

    gl_FragColor = vec4(col * 0.85, 1.0);
  }
`

export default function Nebula() {
  const matRef = useRef()
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh scale={200} frustumCulled={false}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
        fog={false}
      />
    </mesh>
  )
}
