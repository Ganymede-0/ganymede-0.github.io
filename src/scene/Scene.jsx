import { Suspense, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor, Preload } from '@react-three/drei'
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
import DustField from './DustField'
import OrbitSkater from './OrbitSkater'
import ParallaxRig from './ParallaxRig'
import Planet from './Planet'
import Station from './Station'
import OrbitPath from './OrbitPath'
import CameraRig from './CameraRig'
import ResponsiveFraming from './ResponsiveFraming'
import Lighting from './Lighting'
import { projects, CATEGORY } from '../data/projects'
import { useNavigationStore } from '../state/navigationStore'
import { useReducedMotion } from './useReducedMotion'

// Set to true once a rigged, animated character exists at public/models/skater.glb.
// Left off by default so the app never requests a file that isn't there.
const SHOW_SKATER = false

export default function Scene() {
  // Resolution is the ONLY thing that adapts to performance. The effect chain
  // is fixed, so the scene's look is identical on every machine — only its
  // sharpness differs.
  // Phones pack 3x device pixels behind a small screen; rendering this scene at
  // full DPR there is pure waste and the main cause of a hot, stuttering
  // handset. Start conservative on small viewports and let the monitor raise it.
  const isSmall = typeof window !== 'undefined' && window.innerWidth < 900
  const [dpr, setDpr] = useState(isSmall ? 1 : 1.35)
  // The Sun's photosphere mesh — the GodRays light source.
  const [sunMesh, setSunMesh] = useState(null)
  const activeId = useNavigationStore((s) => s.activeId)
  const returnToOverview = useNavigationStore((s) => s.returnToOverview)
  const view = useNavigationStore((s) => s.view)
  const reducedMotion = useReducedMotion()

  const onDecline = useCallback(() => setDpr(isSmall ? 0.8 : 1), [isSmall])
  // Recovery must be symmetric. An earlier build only ever restored dpr while
  // permanently disabling effects, making the quality drop a one-way latch that
  // the scene could never climb back out of.
  const onIncline = useCallback(() => setDpr(isSmall ? 1.2 : 1.35), [isSmall])

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
      {/* NOTE: <AdaptiveDpr> was removed. It writes the same `dpr` state this
          monitor writes, so the two fought each other — dpr oscillated, which
          re-allocated every render target in the composer on each change. That
          churn is a large part of the "it dims / destabilises after a couple of
          minutes" behaviour. One controller for resolution, and only one. */}
      <PerformanceMonitor
        bounds={() => [38, 58]}
        flipflops={3}
        onDecline={onDecline}
        onIncline={onIncline}
        onFallback={onDecline}
      />

      <color attach="background" args={['#010206']} />
      <fog attach="fog" args={['#02040a', 60, 170]} />

      <Suspense fallback={null}>
        <Lighting />

        {/* Deep background on the parallax rig: space tilts subtly against the
            pointer, giving the far layers inertia the orbital system doesn't
            share — instant, felt depth. */}
        <ParallaxRig>
          <Nebula />
          <Starfield />
          {/* Additive dust — see DustField for why this replaced <Sparkles>. */}
          <DustField
            count={isSmall ? 110 : 220}
            extent={[48, 24, 48]}
            size={9}
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

        {SHOW_SKATER && (
          <OrbitSkater
            url="/models/skater.glb"
            radius={12}
            tilt={0.04}
            speed={0.05}
            scale={1}
          />
        )}

        <Preload all />
      </Suspense>

      <ResponsiveFraming />
      <CameraRig />

      {/* The composer is ALWAYS mounted. It carries the tone mapping and bloom
          that the entire scene's exposure is authored against — unmounting it
          (as the previous build did on any perf dip) doesn't "simplify" the
          scene, it collapses the lighting to a dark, ungraded frame and never
          recovers. Degradation happens *inside* the chain instead. */}
      <EffectComposer multisampling={0} enableNormalPass={false}>
        {/* Volumetric light shafts from the Sun, occluded by every body that
            passes in front of it.
            STABILITY: this mounts once, as soon as the Sun reports its mesh, and
            is never toggled again. Adding or removing an effect rebuilds the
            whole composer chain and recompiles its shader — doing that in
            response to a frame-rate sample is what made the god rays appear,
            vanish and change the scene's apparent exposure mid-session. Weak
            hardware is now handled purely by resolution, which is free to
            change without disturbing the look. */}
        {sunMesh ? (
          <GodRays
            sun={sunMesh}
            samples={30}
            density={0.82}
            decay={0.9}
            /* weight/exposure were 0.35/0.34 — the shafts stopped reading as
               light *through* the scene and became a flat yellow wash over the
               whole frame. These are the two knobs to touch if you want more. */
            weight={0.15}
            exposure={0.16}
            clampMax={0.55}
            blur
          />
        ) : null}
        {/* luminanceThreshold was 0.2 — low enough that lit planet surfaces and
            even nebula gas crossed it, so nearly the entire image bloomed and
            everything drifted toward white. At 0.55 only genuinely hot things
            (the photosphere, emissive seams, bright stars) bleed. */}
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.85}
          mipmapBlur
          radius={0.62}
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
