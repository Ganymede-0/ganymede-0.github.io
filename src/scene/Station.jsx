import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { orbitClock, bodyRegistry } from './orbitClock'
import { useNavigationStore } from '../state/navigationStore'

// Experience isn't a planet — it's built, not discovered. So it's a station:
// a hard-edged assembly of a hull, a truss, and two solar arrays, rendered
// in flat metal against a system of soft atmospheric spheres. The silhouette
// alone tells a recruiter this node is a different *kind* of thing.
export default function Station({ project }) {
  const orbitRef = useRef()
  const bodyRef = useRef()
  const groupRef = useRef()

  const focusBody = useNavigationStore((s) => s.focusBody)
  const setHovered = useNavigationStore((s) => s.setHovered)
  const hoveredId = useNavigationStore((s) => s.hoveredId)
  const activeId = useNavigationStore((s) => s.activeId)
  const view = useNavigationStore((s) => s.view)

  const isHovered = hoveredId === project.id
  const isActive = activeId === project.id
  const dimmed = activeId !== null && !isActive

  useEffect(() => {
    if (groupRef.current) bodyRegistry.set(project.id, groupRef.current)
    return () => bodyRegistry.delete(project.id)
  }, [project.id])

  useFrame((_, delta) => {
    const angle = project.startAngle + orbitClock.elapsed * project.orbitSpeed
    if (orbitRef.current) orbitRef.current.rotation.y = angle
    if (bodyRef.current) {
      bodyRef.current.rotation.z += delta * 0.25 * Math.max(orbitClock.scale, 0.15)
      const target = isHovered || isActive ? 1.15 : 1
      bodyRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.12)
    }
  })

  const interactive = view !== 'transitioning'
  const opacity = dimmed ? 0.4 : 1

  return (
    <group ref={orbitRef} rotation={[project.orbitTilt, 0, project.orbitTilt * 0.5]}>
      <group ref={groupRef} position={[project.orbitRadius, 0, 0]}>
        <group
          ref={bodyRef}
          scale={project.size}
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
          {/* hull */}
          <mesh>
            <cylinderGeometry args={[0.34, 0.34, 1.1, 16]} />
            <meshStandardMaterial
              color="#c6ccd8"
              metalness={0.85}
              roughness={0.32}
              envMapIntensity={1.4}
              emissive={new THREE.Color('#20293a')}
              emissiveIntensity={0.5}
              transparent
              opacity={opacity}
            />
          </mesh>
          {/* docking collar */}
          <mesh position={[0, 0.68, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.3, 12]} />
            <meshStandardMaterial
              color={project.color}
              emissive={new THREE.Color(project.emissive)}
              emissiveIntensity={isHovered ? 1.4 : 0.7}
              metalness={0.6}
              roughness={0.4}
              transparent
              opacity={opacity}
            />
          </mesh>
          {/* truss */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 2.4, 8]} />
            <meshStandardMaterial
              color="#8791a3"
              metalness={0.8}
              roughness={0.4}
              transparent
              opacity={opacity}
            />
          </mesh>
          {/* solar arrays */}
          {[-1, 1].map((dir) => (
            <mesh key={dir} position={[dir * 1.0, 0, 0]}>
              <boxGeometry args={[0.9, 0.02, 0.62]} />
              <meshStandardMaterial
                color="#1d2b52"
                emissive={new THREE.Color('#2f4d8a')}
                emissiveIntensity={0.35}
                metalness={0.5}
                roughness={0.3}
                transparent
                opacity={opacity}
              />
            </mesh>
          ))}
        </group>

        {view === 'overview' && (
          <Html
            position={[0, 1.0, 0]}
            center
            distanceFactor={16}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <div className={`body-label body-label--station ${isHovered ? 'is-hovered' : ''}`}>
              <span className="body-label__code mono">{project.missionCode}</span>
              <span className="body-label__name">Experience</span>
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}
