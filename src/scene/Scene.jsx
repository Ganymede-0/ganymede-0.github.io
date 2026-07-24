import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor, Preload } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

import Starfield from './Starfield'
import JovianCore from './JovianCore'
import Planet from './Planet'
import Station from './Station'
import OrbitPath from './OrbitPath'
import CameraRig from './CameraRig'
import { projects, CATEGORY } from '../data/projects'
import { useNavigationStore } from '../state/navigationStore'
import { useReducedMotion } from './useReducedMotion'

export default function Scene() {
  const [dpr, setDpr] = useState(1.4)
  const [effectsOn, setEffectsOn] = useState(true)
  const activeId = useNavigationStore((s) => s.activeId)
  const returnToOverview = useNavigationStore((s) => s.returnToOverview)
  const view = useNavigationStore((s) => s.view)
  const reducedMotion = useReducedMotion()

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 11, 27], fov: 46, near: 0.1, far: 400 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => {
        // Clicking empty space is a natural "back" — recruiters won't hunt
        // for a button, and the explicit button is still there for anyone
        // who does.
        if (view === 'focus') returnToOverview()
      }}
    >
      {/* Drop resolution and then effects on weak GPUs before dropping frames. */}
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1)
          setEffectsOn(false)
        }}
        onIncline={() => setDpr(1.5)}
      />
      <AdaptiveDpr pixelated />

      <color attach="background" args={['#05070d']} />
      <fog attach="fog" args={['#05070d', 40, 130]} />
      <ambientLight intensity={0.16} />

      <Suspense fallback={null}>
        <Starfield />
        <JovianCore />

        {projects.map((project) => (
          <OrbitPath
            key={`path-${project.id}`}
            radius={project.orbitRadius}
            tilt={project.orbitTilt}
            color={project.color}
            active={activeId === project.id}
          />
        ))}

        {projects.map((project) =>
          project.category === CATEGORY.STATION ? (
            <Station key={project.id} project={project} />
          ) : (
            <Planet key={project.id} project={project} />
          )
        )}

        <Preload all />
      </Suspense>

      <CameraRig />

      {effectsOn && !reducedMotion && (
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.55}
            luminanceThreshold={0.32}
            luminanceSmoothing={0.85}
            mipmapBlur
          />
          <Vignette offset={0.28} darkness={0.72} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
