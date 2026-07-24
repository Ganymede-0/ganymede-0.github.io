import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import AtmosphereShell from './AtmosphereShell'
import { orbitClock } from './orbitClock'
import { bandsTexture } from './proceduralTextures'

// The center of the system: Jupiter, with Ganymede tucked in close.
//
// This is the one piece of the scene that isn't a project. It's the reason
// the account is called ganymede-0 — the moon is the "you are here" marker,
// and everything else in the portfolio orbits out from it. It's also the
// system's only light source, so every planet is lit from the identity
// at the center. That's the whole thesis of the layout in one object.
export default function JovianCore() {
  const jupiterRef = useRef()
  const ganymedeOrbitRef = useRef()

  const map = useMemo(() => bandsTexture('#c88a4e', '#f0d3a8'), [])

  useFrame((_, delta) => {
    orbitClock.elapsed += delta * orbitClock.scale
    if (jupiterRef.current) {
      jupiterRef.current.rotation.y += delta * 0.035 * orbitClock.scale
    }
    if (ganymedeOrbitRef.current) {
      ganymedeOrbitRef.current.rotation.y = orbitClock.elapsed * 0.42
    }
  })

  return (
    <group>
      {/* The star at the heart of the system — the warm source every project
          is lit from. Tuned to sit *under* the key/fill rig in Lighting.jsx so
          the near orbits aren't blown out while the far ones stay reachable. */}
      <pointLight position={[0, 0, 0]} intensity={130} distance={120} decay={2} color="#ffd6a0" />

      <mesh ref={jupiterRef}>
        <sphereGeometry args={[2.2, 64, 64]} />
        <meshStandardMaterial
          map={map}
          color="#e8b06a"
          emissive={new THREE.Color('#c8763a')}
          emissiveIntensity={0.9}
          roughness={0.82}
          metalness={0}
        />
      </mesh>

      <group scale={2.2}>
        <AtmosphereShell color="#f0b26b" scale={1.18} intensity={1.1} power={2.2} />
      </group>

      {/* Ganymede */}
      <group ref={ganymedeOrbitRef} rotation={[0.22, 0, 0.06]}>
        <mesh position={[3.4, 0, 0]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#dfe3ea" roughness={0.95} metalness={0} />
        </mesh>
      </group>
    </group>
  )
}
