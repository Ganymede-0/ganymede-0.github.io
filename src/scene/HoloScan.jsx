import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

// The telemetry scan rig — the signature interaction. When the camera parks at
// a body, this materializes around it: two counter-rotating gimbal rings and a
// latitude sweep that traces the sphere's cross-section from pole to pole,
// exactly like a volumetric scanner slicing a 3D dataset. For a portfolio
// about 3D medical imaging and industrial telemetry, the metaphor IS the
// content: selecting a project puts it under analysis.
//
// Cost: three toruses with basic additive materials + one Html tag. No
// shaders, no per-frame allocation — negligible next to the planet beneath it.
export default function HoloScan({ color, missionCode }) {
  const gimbalA = useRef()
  const gimbalB = useRef()
  const sweep = useRef()
  const matRefs = useRef([])

  // Fade the whole rig in so it reads as powering on, not popping in.
  useEffect(() => {
    matRefs.current.forEach((m) => m && (m.opacity = 0))
  }, [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (gimbalA.current) gimbalA.current.rotation.z = t * 0.4
    if (gimbalB.current) gimbalB.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.3) * 0.4
    if (sweep.current) {
      // Latitude sweep: y runs pole to pole; the ring radius follows the
      // sphere's cross-section sqrt(R² − y²) so it hugs the surface.
      const R = 1.22
      const y = Math.sin(t * 0.7) * (R - 0.06)
      const r = Math.sqrt(Math.max(R * R - y * y, 0.0001))
      sweep.current.position.y = y
      sweep.current.scale.set(r, r, 1)
    }
    // Power-on fade.
    matRefs.current.forEach((m, i) => {
      if (m) m.opacity = Math.min(m.opacity + delta * 1.5, i === 2 ? 0.85 : 0.5)
    })
  })

  const collect = (i) => (m) => (matRefs.current[i] = m)

  return (
    <group>
      {/* Gimbal ring A — equatorial, slow spin */}
      <mesh ref={gimbalA} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.007, 8, 96]} />
        <meshBasicMaterial
          ref={collect(0)}
          color={color}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Gimbal ring B — precessing */}
      <mesh ref={gimbalB} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.62, 0.005, 8, 96]} />
        <meshBasicMaterial
          ref={collect(1)}
          color={color}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* The scan slice, hugging the surface */}
      <mesh ref={sweep} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.012, 8, 96]} />
        <meshBasicMaterial
          ref={collect(2)}
          color={'#ffffff'}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <Html
        position={[0, 1.95, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div className="scan-tag" style={{ '--accent': color }}>
          <span className="scan-tag__dot" aria-hidden="true" />
          TELEMETRY LOCK · {missionCode}
        </div>
      </Html>
    </group>
  )
}
