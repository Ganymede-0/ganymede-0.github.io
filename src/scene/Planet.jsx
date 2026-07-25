import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import AtmosphereShell from './AtmosphereShell'
import HoloScan from './HoloScan'
import { orbitClock, bodyRegistry } from './orbitClock'
import { createPlanetMaterial } from './planetMaterials'
import { useNavigationStore } from '../state/navigationStore'

// Module-scoped scratch vector — reused every frame so the hover-swell lerp
// doesn't allocate a fresh Vector3 (and feed the GC) 60x/second per planet.
const _scale = new THREE.Vector3()

// ONE sphere shared by every planet. The bodies differ entirely in their
// shaders, so there is no reason to upload the same 96×96 vertex buffer to the
// GPU once per project. Created lazily and never disposed — it lives as long
// as the page does.
const SPHERE = new THREE.SphereGeometry(1, 96, 96)

export default function Planet({ project }) {
  const orbitRef = useRef()   // rotated about Y to carry the body around
  const bodyRef = useRef()    // the planet itself (spin + hover scale)
  const groupRef = useRef()   // world-space anchor the camera targets

  const focusBody = useNavigationStore((s) => s.focusBody)
  const setHovered = useNavigationStore((s) => s.setHovered)
  const hoveredId = useNavigationStore((s) => s.hoveredId)
  const activeId = useNavigationStore((s) => s.activeId)
  const view = useNavigationStore((s) => s.view)

  const isHovered = hoveredId === project.id
  const isActive = activeId === project.id
  const dimmed = activeId !== null && !isActive

  // The body's bespoke surface shader. Built once per project and disposed on
  // unmount so hot-reloads and remounts don't leak GPU programs.
  const material = useMemo(() => createPlanetMaterial(project), [project.id])
  useEffect(() => () => material.dispose(), [material])

  useEffect(() => {
    if (groupRef.current) bodyRegistry.set(project.id, groupRef.current)
    return () => bodyRegistry.delete(project.id)
  }, [project.id])

  useFrame((state, delta) => {
    const angle = project.startAngle + orbitClock.elapsed * project.orbitSpeed
    if (orbitRef.current) orbitRef.current.rotation.y = angle
    if (bodyRef.current) {
      bodyRef.current.rotation.y += delta * 0.12 * Math.max(orbitClock.scale, 0.15)
      // A small, quick swell on hover — enough to confirm the target is live
      const target = isHovered || isActive ? 1.12 : 1
      bodyRef.current.scale.lerp(_scale.setScalar(target), 0.12)
    }
    // Drive the surface animation on a continuous clock so scan lines / grids /
    // energy keep breathing even when the orbital system is parked at a body.
    const u = material.userData.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uEmitStrength.value = dimmed ? 0.35 : isHovered || isActive ? 1.6 : 1.0
    material.opacity = dimmed ? 0.5 : 1
  })

  const interactive = view !== 'transitioning'

  return (
    <group ref={orbitRef} rotation={[project.orbitTilt, 0, project.orbitTilt * 0.5]}>
      <group ref={groupRef} position={[project.orbitRadius, 0, 0]}>
        <group
          ref={bodyRef}
          onClick={(e) => {
            e.stopPropagation()
            if (interactive) focusBody(project.id)
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            if (interactive) {
              setHovered(project.id)
              document.body.style.cursor = 'pointer'
            }
          }}
          onPointerOut={() => {
            setHovered(null)
            document.body.style.cursor = 'auto'
          }}
        >
          <mesh scale={project.size} material={material} geometry={SPHERE} />

          <group scale={project.size}>
            <AtmosphereShell
              color={project.color}
              scale={1.16}
              intensity={dimmed ? 0.25 : isHovered ? 1.3 : 0.85}
            />
          </group>
        </group>

        {/* Telemetry scan rig — materializes once the camera has parked. */}
        {isActive && view === 'focus' && (
          <group scale={project.size}>
            <HoloScan color={project.color} missionCode={project.missionCode} />
          </group>
        )}

        {/* Label. Hidden during flight and while a panel is open so the
            readable UI never competes with floating 3D text. */}
        {view === 'overview' && (
          <Html
            position={[0, project.size + 0.75, 0]}
            center
            distanceFactor={16}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <div className={`body-label ${isHovered ? 'is-hovered' : ''}`}>
              <span className="body-label__code mono">{project.missionCode}</span>
              <span className="body-label__name">{project.name}</span>
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}
