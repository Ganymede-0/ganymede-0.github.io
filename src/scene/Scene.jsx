import { Suspense, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor, Preload, Sparkles } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  ToneMapping,
  GodRays,
  Noise,
} from '@react-three/postprocessing'
import { ToneMappingMode, BlendFunction } from 'postprocessing'
import { Vector2, NoToneMapping } from 'three'

import Starfield from './Starfield'
import Nebula from './Nebula'
import Sun from './Sun'
import ParallaxRig from './ParallaxRig'
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
  // Quality tier, NOT an on/off switch for the colour pipeline. See the
  // PerformanceMonitor note below — this only gates the single most expensive
  // pass (god rays), never the grading that the scene's whole look depends on.
  const [highQuality, setHighQuality] = useState(true)
  // The Sun's photosphere mesh — the GodRays light source.
  const [sunMesh, setSunMesh] = useState(null)
  const activeId = useNavigationStore((s) => s.activeId)
  const returnToOverview = useNavigationStore((s) => s.returnToOverview)
  const view = useNavigationStore((s) => s.view)
  const reducedMotion = useReducedMotion()

  const onDecline = useCallback(() => {
    setDpr(1)
    setHighQuality(false)
  }, [])
  // Recovery must be symmetric. The previous build only ever restored dpr,
  // which made the quality drop a permanent, one-way latch.
  const onIncline = useCallback(() => {
    setDpr(1.4)
    setHighQuality(true)
  }, [])

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 11, 27], fov: 46, near: 0.1, far: 400 }}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        // CRITICAL: the <ToneMapping> effect below tone-maps the composited
        // frame. R3F defaults the renderer to ACESFilmic, which tone-maps every
        // material a second time in its own shader — ACES applied twice crushes
        // and desaturates the whole scene. Postprocessing owns tone mapping
        // exclusively; the renderer must stay linear.
        toneMapping: NoToneMapping,
      }}
      onPointerMissed={() => {
        // Clicking empty space is a natural "back" — recruiters won't hunt
        // for a button, and the explicit button is still there for anyone
        // who does.
        if (view === 'focus') returnToOverview()
      }}
    >
      {/* Judge against ABSOLUTE fps, not the refresh rate. drei's default bound
          is `refreshrate > 100 ? [60, 100] : [40, 60]` — on a 120/144Hz monitor
          that declares a perfectly good 58fps render a failure and degrades the
          scene on capable hardware. `flipflops` stops it oscillating forever. */}
      <PerformanceMonitor
        bounds={() => [38, 58]}
        flipflops={3}
        onDecline={onDecline}
        onIncline={onIncline}
        onFallback={onDecline}
      />
      <AdaptiveDpr pixelated />

      <color attach="background" args={['#05070d']} />
      <fog attach="fog" args={['#060912', 55, 150]} />

      <Suspense fallback={null}>
        <Lighting />

        {/* Deep background on the parallax rig: space tilts subtly against the
            pointer, giving the far layers inertia the orbital system doesn't
            share — instant, felt depth. */}
        <ParallaxRig>
          <Nebula />
          <Starfield />
          {/* Ionised dust drifting between the orbits. Bright enough to cross
              the bloom threshold, so the particles bloom into soft points of
              light rather than sitting flat against the nebula. */}
          <Sparkles
            count={140}
            scale={[46, 22, 46]}
            size={5}
            speed={0.3}
            opacity={1}
            noise={0.5}
            color="#cfe2ff"
          />
        </ParallaxRig>

        <Sun onReady={setSunMesh} />

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

      {/* The composer is ALWAYS mounted. It carries the tone mapping and bloom
          that the entire scene's exposure is authored against — unmounting it
          (as the previous build did on any perf dip) doesn't "simplify" the
          scene, it collapses the lighting to a dark, ungraded frame and never
          recovers. Degradation happens *inside* the chain instead. */}
      <EffectComposer multisampling={0} enableNormalPass={false}>
        {/* Volumetric light shafts from the Sun, occluded by every body that
            passes in front of it. The one pass expensive enough to drop on
            weak hardware — everything below it always runs. */}
        {highQuality && sunMesh ? (
          <GodRays
            sun={sunMesh}
            samples={36}
            density={0.95}
            decay={0.93}
            weight={0.3}
            exposure={0.3}
            clampMax={0.9}
            blur
          />
        ) : null}
        <Bloom
          intensity={0.95}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.72}
        />
        <ChromaticAberration
          offset={new Vector2(0.0006, 0.0009)}
          radialModulation={false}
        />
        <Vignette offset={0.24} darkness={0.72} />
        {/* Fine photographic grain — kills WebGL's too-clean gradient banding.
            Motion-sensitive viewers get a still frame, not a dark one. */}
        {!reducedMotion && (
          <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.38} />
        )}
        {/* Sole owner of tone mapping (renderer is NoToneMapping — see gl above). */}
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  )
}
