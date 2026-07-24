import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor, Preload, Sparkles } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  ToneMapping,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Vector2 } from 'three'

import Starfield from './Starfield'
import JovianCore from './JovianCore'
import Planet from './Planet'
import Station from './Station'
import OrbitPath from './OrbitPath'
import CameraRig from './CameraRig'
import Lighting from './Lighting'
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
      <fog attach="fog" args={['#060912', 55, 150]} />

      <Suspense fallback={null}>
        <Lighting />
        <Starfield />
        <JovianCore />

        {/* Fine drifting particulate — reads as backscatter / ionised dust and
            gives the empty space between orbits a sense of depth and scale. */}
        <Sparkles
          count={90}
          scale={[46, 20, 46]}
          size={2.4}
          speed={0.25}
          opacity={0.5}
          color="#8fb6ff"
        />

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
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom
            intensity={0.85}
            luminanceThreshold={0.22}
            luminanceSmoothing={0.9}
            mipmapBlur
            radius={0.7}
          />
          <ChromaticAberration
            offset={new Vector2(0.0006, 0.0009)}
            radialModulation={false}
          />
          <Vignette offset={0.22} darkness={0.78} />
          {/* Explicit tone-map pass: postprocessing owns tone mapping once a
              composer is present, so we map ACES here to keep highlights from
              clipping to flat white after bloom. */}
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
