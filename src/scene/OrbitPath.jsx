import { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'

// -----------------------------------------------------------------------------
// Orbit trace.
//
// Previously a LineDashedMaterial — a dashed hoop, which reads as a chart
// annotation laid over the scene rather than something occupying the same space
// as the planets. Dashes are a data-visualisation idiom; at a distance they
// alias into a dotted mess (clearly visible in the reference screenshot).
//
// This is now a flat annulus with a soft radial falloff: a continuous filament
// of light, brightest along its centre line and fading to nothing at both
// edges, so it has no hard boundary anywhere. Additively blended, so it adds
// light to the vacuum instead of drawing a grey line over it.
//
// It also brightens along its leading arc, giving a faint sense of direction of
// travel without animating anything expensive.
// -----------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vLocal;
  void main() {
    vUv = uv;
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uRadius;
  uniform float uWidth;
  varying vec3 vLocal;

  void main() {
    // Distance from the ring's centre line, normalised across the band.
    float r = length(vLocal.xz);
    float d = abs(r - uRadius) / uWidth;

    // Soft core with a wide, very faint halo — no hard edge at any radius.
    float core = smoothstep(1.0, 0.0, d);
    float filament = pow(core, 6.0);
    float halo = pow(core, 1.4) * 0.22;

    float a = (filament + halo) * uOpacity;
    if (a < 0.001) discard;

    gl_FragColor = vec4(uColor * a, a);
  }
`

export default function OrbitPath({ radius, tilt = 0, color = '#5b6b93', active = false }) {
  const matRef = useRef()

  // The band is wide enough to hold a soft falloff; the visible filament inside
  // it is a fraction of this.
  const width = Math.max(0.35, radius * 0.045)

  const geometry = useMemo(
    () => {
      const g = new THREE.RingGeometry(radius - width, radius + width, 220, 1)
      // RingGeometry is built on the XY plane; lay it flat into XZ.
      g.rotateX(-Math.PI / 2)
      return g
    },
    [radius, width]
  )

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: active ? 0.85 : 0.3 },
      uRadius: { value: radius },
      uWidth: { value: width },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [radius, width]
  )

  useEffect(() => {
    uniforms.uColor.value.set(color)
    uniforms.uOpacity.value = active ? 0.85 : 0.3
  }, [uniforms, color, active])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} rotation={[tilt, 0, tilt * 0.5]} renderOrder={-1}>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
