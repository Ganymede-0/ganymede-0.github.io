import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { orbitClock } from './orbitClock'
import { sunTexture, radialGlowTexture } from './proceduralTextures'

// -----------------------------------------------------------------------------
// The Sun — the identity at the centre of the system. Everything orbits it,
// and it is the system's only real light source, so the whole portfolio is lit
// from you.
//
// Per the brief this body is TEXTURE-driven, not a procedural fragment shader:
// a boiling-granulation photosphere on the emissive channel + a layered
// additive corona + a warm point light. Bloom (in Scene.jsx) turns the bright
// emissive into a real solar glow.
//
// ── Upgrading to a photographic sun ──────────────────────────────────────────
// To swap in a hyper-real NASA/SDO texture, drop a JPG into `public/textures/`
// and replace the `useMemo(sunTexture...)` line with drei's useTexture:
//
//   import { useTexture } from '@react-three/drei'
//   const map = useTexture('/textures/sun_surface.jpg')
//   map.colorSpace = THREE.SRGBColorSpace
//
// then feed `map` to `emissiveMap` exactly as below. Everything else is
// unchanged. Free 2K–8K sun textures: solarsystemscope.com/textures (2K "Sun")
// or NASA SDO/AIA imagery. (Kept procedural here so the repo needs zero binary
// assets and never breaks GitHub Pages path resolution.)
// -----------------------------------------------------------------------------
export default function Sun({ onReady }) {
  const coreRef = useRef()
  const matRef = useRef()

  const surface = useMemo(() => sunTexture(1024), [])
  const glow = useMemo(() => radialGlowTexture(512), [])

  // Hand the photosphere mesh up to Scene so the GodRays pass can use it as
  // its light source. Effects mount only after this fires.
  useEffect(() => {
    if (coreRef.current) onReady?.(coreRef.current)
  }, [onReady])

  useFrame((state, delta) => {
    // The Sun owns the shared orbital clock: advancing it here is what carries
    // every planet around its ring. (Do not remove — the system stops otherwise.)
    orbitClock.elapsed += delta * orbitClock.scale

    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.02 * Math.max(orbitClock.scale, 0.05)
    }
    if (matRef.current) {
      // A slow luminosity breath so the surface never looks like a static decal.
      matRef.current.emissiveIntensity = 1.4 + Math.sin(state.clock.elapsedTime * 1.4) * 0.12
    }
  })

  return (
    <group>
      {/* The star's warm light — every planet is lit from the centre identity. */}
      <pointLight position={[0, 0, 0]} intensity={130} distance={120} decay={2} color="#ffd6a0" />

      {/* Corona: two additive, camera-facing glow billboards. No shader. */}
      <sprite scale={[13, 13, 1]}>
        <spriteMaterial
          map={glow}
          color="#ff9a4d"
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.4}
          toneMapped={false}
        />
      </sprite>
      <sprite scale={[7.5, 7.5, 1]}>
        <spriteMaterial
          map={glow}
          color="#ffd9a0"
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.6}
          toneMapped={false}
        />
      </sprite>

      {/* Photosphere — purely emissive so it self-illuminates and blooms. */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[2.4, 64, 64]} />
        <meshStandardMaterial
          ref={matRef}
          emissiveMap={surface}
          emissive={'#ffffff'}
          emissiveIntensity={1.4}
          color={'#1a0800'}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  )
}
