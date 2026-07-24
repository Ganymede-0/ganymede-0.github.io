import { useMemo } from 'react'
import * as THREE from 'three'

// A fresnel rim-light shell. This is the single cheapest trick that makes a
// sphere read as a *world* rather than a ball: light gathers at the limb and
// falls off toward the center, exactly like an atmosphere seen edge-on.
// One extra draw call per body, no textures, no post-processing dependency.

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), uPower);
    gl_FragColor = vec4(uColor, fresnel * uIntensity);
  }
`

export default function AtmosphereShell({
  color = '#6fe7dc',
  scale = 1.14,
  intensity = 0.9,
  power = 2.6,
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
          uPower: { value: power },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [color, intensity, power]
  )

  return (
    <mesh scale={scale} material={material}>
      <sphereGeometry args={[1, 48, 48]} />
    </mesh>
  )
}
