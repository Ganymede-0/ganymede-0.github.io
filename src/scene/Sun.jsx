import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { orbitClock } from './orbitClock'
import { SIMPLEX_3D } from './glslNoise'

// -----------------------------------------------------------------------------
// The Sun — the identity at the centre of the system.
//
// This replaces the previous canvas-texture version, which drew literal circles
// onto a 2D canvas and therefore rendered as discrete white polka-dots wrapped
// around a ball (visible in the reference screenshot). Real solar granulation is
// a *turbulent convection field*, not scattered discs, so it is now generated in
// 3D object space where there is no UV seam and no pole pinching.
//
// What makes it read as a star rather than an orange sphere:
//   · supergranulation warping fine granulation (domain warp) — convection cells
//   · limb darkening, I(μ) = a + b·μ — the physical reason the Sun's edge is
//     visibly dimmer and redder than its centre. Without this, any sun looks
//     like a flat disc.
//   · a temperature ramp through ember → orange → gold → white rather than a
//     single hue with brightness variation
//   · sunspot umbrae from a low-frequency field, with warm penumbral edges
//   · HDR output (values well above 1.0) so Bloom has something real to bleed,
//     and ACES in post rolls the highlights off instead of clipping to flat white
//
// The core is fully OPAQUE (depthWrite on, no transparency, no additive) — the
// previous build's sprite-based corona sat in front of the photosphere and made
// the whole star look see-through.
// -----------------------------------------------------------------------------

const coreVert = /* glsl */ `
  varying vec3 vObj;
  varying vec3 vNormalV;
  varying vec3 vViewDirV;
  void main() {
    vObj = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalV = normalize(normalMatrix * normal);
    vViewDirV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const coreFrag = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vObj;
  varying vec3 vNormalV;
  varying vec3 vViewDirV;
  ${SIMPLEX_3D}

  // Temperature ramp. Blackbody-inspired rather than physically exact: the
  // hottest material goes white, the coolest (spot umbrae) to a dark ember.
  vec3 sunRamp(float t){
    t = clamp(t, 0.0, 1.0);
    // Umbra is near-black brown, not red. A sunspot is cool material seen
    // against a far brighter background — photographs read it as a dark hole,
    // and the previous saturated red made them look like painted blotches.
    vec3 c = mix(vec3(0.10, 0.035, 0.015), vec3(0.85, 0.30, 0.06), smoothstep(0.00, 0.30, t));
    c = mix(c, vec3(1.0, 0.62, 0.16), smoothstep(0.28, 0.55, t));
    c = mix(c, vec3(1.0, 0.88, 0.55), smoothstep(0.52, 0.80, t));
    c = mix(c, vec3(1.0, 0.97, 0.90), smoothstep(0.80, 1.0, t));
    return c;
  }

  void main() {
    vec3 p = normalize(vObj);
    float t = uTime * 0.035;

    // Supergranulation: slow, large convection cells.
    float sg = fbm(p * 1.9 + vec3(0.0, t * 0.5, 0.0));
    // Fine granulation, domain-warped by the supergranules so cells cluster and
    // flow along the large-scale motion instead of tiling uniformly.
    float gran = fbm(p * 6.5 + sg * 1.6 + t);

    float h = clamp(gran * 0.62 + sg * 0.38, -1.0, 1.0) * 0.5 + 0.5;

    // Sunspots. Higher frequency and a tighter threshold than before: at 1.25
    // the field produced two or three enormous blotches covering much of the
    // disc. Real spot groups are small relative to the star and appear in
    // clusters, so this is finer and rarer, with a soft penumbral shoulder.
    float spotF = snoise(p * 3.4 + 40.0);
    float umbra = smoothstep(0.68, 0.86, spotF);
    float penumbra = smoothstep(0.56, 0.72, spotF) * 0.45;

    float temp = clamp(h * 1.08 - umbra * 0.9 - penumbra * 0.3, 0.0, 1.0);
    vec3 col = sunRamp(temp);

    // Limb darkening. mu = cos(angle between surface normal and the viewer).
    float mu = clamp(dot(normalize(vNormalV), normalize(vViewDirV)), 0.0, 1.0);
    float limb = 0.30 + 0.70 * pow(mu, 0.65);
    col *= limb;

    // Faculae: bright magnetic flux lanes, most visible near the limb — the
    // detail that stops the edge reading as a flat vignette.
    float fac = smoothstep(0.62, 0.95, gran) * (1.0 - mu) * 0.8;
    col += vec3(1.0, 0.92, 0.75) * fac;

    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`

// -----------------------------------------------------------------------------
// Corona — a camera-facing BILLBOARD, not a sphere.
//
// The previous version was a back-side sphere whose alpha was driven by
// `pow(1 - |dot(N,V)|, k)`. On a sphere that term is MAXIMAL exactly at the
// silhouette, so the shell was at its brightest precisely where its geometry
// ended — painting a hard-edged translucent ball around the star. That is the
// grey ring in the reference screenshot, and it is inherent to the approach:
// any glow built from geometry has a boundary where the geometry stops.
//
// A billboard has no such boundary. The falloff is computed radially in UV
// space and is forced to zero well before the quad's edge, so there is nothing
// to see but light thinning into vacuum.
// -----------------------------------------------------------------------------
const coronaVert = /* glsl */ `
  uniform float uScale;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Billboard: take the object's origin in view space, then offset in screen
    // axes. The quad always faces the camera without any CPU-side lookAt.
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * uScale;
    gl_Position = projectionMatrix * mv;
  }
`

const coronaFrag = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  ${SIMPLEX_3D}

  void main() {
    vec2 c = (vUv - 0.5) * 2.0;
    float d = length(c);
    if (d > 1.0) discard;

    // The photosphere occupies the inner portion of the quad; the corona starts
    // at its limb and thins outward.
    float inner = 0.52;
    float t = max(d - inner, 0.0) / (1.0 - inner);

    // Exponential thinning, then an explicit fade to ZERO before the quad edge
    // so no boundary can ever be visible.
    float glow = exp(-t * 3.4) * smoothstep(1.0, 0.82, d);

    // Faint streamers along the field, so it isn't a clean airbrush gradient.
    float ang = atan(c.y, c.x);
    float streak = fbm(vec3(cos(ang) * 2.0, sin(ang) * 2.0, uTime * 0.05)) * 0.5 + 0.5;
    glow *= 0.75 + 0.5 * streak;

    // Hollow out the centre — the opaque disc is drawn there anyway, and
    // stacking the glow on top of it is what made the star look milky.
    glow *= smoothstep(0.34, 0.6, d);

    vec3 col = mix(vec3(1.0, 0.62, 0.22), vec3(1.0, 0.86, 0.60), 1.0 - t);
    float a = glow * uIntensity;
    gl_FragColor = vec4(col * a, a);
  }
`

export default function Sun({ onReady, onStartApproach, onSunHover }) {
  const coreRef = useRef()

  // EXPOSURE: this is the master brightness of the star and the value the whole
  // scene is graded against. At 3.4 the photosphere clipped to flat white, the
  // bloom bled across most of the frame, and the god rays washed everything in
  // yellow haze — the planets lost their own colour entirely. 1.15 keeps the
  // disc bright and clearly the hottest thing in frame while leaving headroom
  // for ACES to roll off instead of clipping.
  const coreUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uIntensity: { value: 1.15 } }),
    []
  )
  const coronaUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uIntensity: { value: 0.5 }, uScale: { value: 4.6 } }),
    []
  )

  const coreGeo = useMemo(() => new THREE.SphereGeometry(2.4, 96, 96), [])
  // A unit quad; the billboard vertex shader scales and orients it.
  const coronaGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  useEffect(() => {
    return () => {
      coreGeo.dispose()
      coronaGeo.dispose()
    }
  }, [coreGeo, coronaGeo])

  // Hand the photosphere mesh up to Scene so the GodRays pass can use it as its
  // light source.
  useEffect(() => {
    if (coreRef.current) onReady?.(coreRef.current)
  }, [onReady])

  useFrame((state, delta) => {
    // The Sun owns the shared orbital clock: advancing it here is what carries
    // every planet around its ring. (Do not remove — the system stops otherwise.)
    orbitClock.elapsed += delta * orbitClock.scale

    const t = state.clock.elapsedTime
    coreUniforms.uTime.value = t
    coronaUniforms.uTime.value = t

    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.018 * Math.max(orbitClock.scale, 0.05)
    }
    // NOTE: the star's luminosity is deliberately CONSTANT. An earlier build
    // oscillated emissiveIntensity with a sine wave, which drove the bloom
    // threshold in and out of range and read as the whole scene pulsing
    // brighter and darker. A star does not visibly flicker.
  })

  return (
    <group>
      {/* The system's warm light source. */}
      <pointLight position={[0, 0, 0]} intensity={95} distance={140} decay={2} color="#ffd6a0" />

      {/* Photosphere — opaque, depth-writing, the GodRays source.
          It is also the doorway into the approach sequence: the star is the
          one body that represents Sarah rather than a project, so clicking it
          is what opens her story. The <Html> beacon above carries the label
          and the keyboard-focusable button; this makes the star itself a
          target too, because a visitor told "start here" will aim at the
          glowing sphere, not at the caption floating over it. */}
      <mesh
        ref={coreRef}
        geometry={coreGeo}
        renderOrder={0}
        onClick={(e) => {
          // Without this the click also reaches the canvas as a "missed"
          // pointer event, which dismisses the arrival cue on the way past.
          e.stopPropagation()
          onStartApproach?.()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.classList.add('is-pointing')
          onSunHover?.(true)
        }}
        onPointerOut={() => {
          document.body.classList.remove('is-pointing')
          onSunHover?.(false)
        }}
      >
        <shaderMaterial
          vertexShader={coreVert}
          fragmentShader={coreFrag}
          uniforms={coreUniforms}
          transparent={false}
          depthWrite
          toneMapped={false}
        />
      </mesh>

      {/* Corona — additive camera-facing billboard. `frustumCulled` is off
          because the vertex shader moves the quad, so its CPU-side bounds are
          meaningless and three would cull it at the wrong moments. */}
      <mesh geometry={coronaGeo} renderOrder={1} frustumCulled={false}>
        <shaderMaterial
          vertexShader={coronaVert}
          fragmentShader={coronaFrag}
          uniforms={coronaUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
