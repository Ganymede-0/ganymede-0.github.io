import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// One shared shell geometry for every atmosphere in the scene.
const SHELL = new THREE.SphereGeometry(1, 48, 48)
const _world = new THREE.Vector3()

// -----------------------------------------------------------------------------
// Atmospheric scattering.
//
// The previous version was a bare fresnel — `pow(1 - dot(N,V), k)` — which
// glows uniformly around the entire silhouette including the night side. That
// is the single biggest tell of a fake atmosphere: real air is only visible
// where sunlight is passing through it, so a planet's halo is bright on the
// day limb, narrows through the terminator, and vanishes behind.
//
// This model adds the three things that actually sell it:
//
//   1. TERMINATOR — scattering is gated by the sun's incidence on the shell, so
//      the glow wraps the lit limb and dies on the night side.
//   2. RAYLEIGH — wavelength-dependent (blue scatters ~5.5x more than red), with
//      the standard phase function 0.75·(1 + cos²θ). This is why the day limb
//      goes blue-white while grazing angles redden.
//   3. MIE FORWARD-SCATTER — a sharp forward lobe that ignites when you view the
//      planet with the star behind it, giving the bright rim-light flare.
//
// Sun is at the world origin, so the light direction is simply -normalize(P).
// -----------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewW;
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewW = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  uniform vec3 uBodyCenter;
  varying vec3 vNormalW;
  varying vec3 vViewW;
  varying vec3 vWorld;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewW);

    // The star sits at the world origin.
    vec3 L = normalize(-uBodyCenter);

    // Optical depth through the shell: maximal at the limb, ~0 face-on.
    float limb = pow(1.0 - abs(dot(N, V)), uPower);

    // Terminator. Soft, and biased slightly past 90° because atmosphere stays
    // lit a little beyond the geometric terminator (that's twilight).
    float mu = dot(N, L);
    float daylight = smoothstep(-0.28, 0.30, mu);

    float cosT = dot(V, L);

    // Rayleigh phase.
    float rayleigh = 0.75 * (1.0 + cosT * cosT);
    // Wavelength dependence, normalised around the body's own accent hue so
    // each planet keeps its identity while behaving like air.
    vec3 beta = uColor * vec3(1.0, 0.86, 0.72) + vec3(0.10, 0.22, 0.55);

    // Mie forward lobe — the flare when the star is directly behind the body.
    float mie = pow(max(cosT, 0.0), 20.0);

    vec3 scatter = beta * rayleigh;
    // Mie lobe kept restrained — at 1.6 the forward flare swamped the body it
    // was supposed to be wrapping.
    scatter += vec3(1.0, 0.88, 0.70) * mie * 0.85;

    // Grazing rays traverse more air, so the low limb reddens.
    float reddening = smoothstep(0.55, 0.0, mu);
    scatter = mix(scatter, scatter * vec3(1.25, 0.62, 0.36), reddening * 0.55);

    float alpha = limb * daylight * uIntensity;
    // Keep the forward flare visible even as the terminator closes.
    alpha += limb * mie * uIntensity * 0.5;

    gl_FragColor = vec4(scatter * alpha, alpha);
  }
`

export default function AtmosphereShell({
  color = '#6fe7dc',
  scale = 1.14,
  intensity = 0.9,
  power = 2.6,
}) {
  const meshRef = useRef()

  // Built ONCE. `intensity` changes on every hover and focus change — rebuilding
  // the ShaderMaterial for that forces a fresh GLSL compile and link
  // mid-interaction, which is exactly the hitch you feel sweeping the pointer
  // across the system. Uniforms are mutated in place instead.
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
          uPower: { value: power },
          uBodyCenter: { value: new THREE.Vector3(1, 0, 0) },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => {
    material.uniforms.uColor.value.set(color)
    material.uniforms.uIntensity.value = intensity
    material.uniforms.uPower.value = power
  }, [material, color, intensity, power])

  useEffect(() => () => material.dispose(), [material])

  // The body orbits, so its world position — and therefore which side of it the
  // star lights — changes every frame.
  useFrame(() => {
    if (!meshRef.current) return
    meshRef.current.getWorldPosition(_world)
    material.uniforms.uBodyCenter.value.copy(_world)
  })

  return <mesh ref={meshRef} scale={scale} material={material} geometry={SHELL} />
}
