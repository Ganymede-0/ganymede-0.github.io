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
import SunCue from './SunCue'
import Rocket from './Rocket'
import DustField from './DustField'
import OrbitSkater from './OrbitSkater'
import ParallaxRig from './ParallaxRig'
import Planet from './Planet'
import Station from './Station'
import OrbitPath from './OrbitPath'
import CameraRig from './CameraRig'
import StarDive from './StarDive'
import Wormhole from './Wormhole'
import ResponsiveFraming from './ResponsiveFraming'
import Lighting from './Lighting'
import { projects, CATEGORY } from '../data/projects'
import { useNavigationStore } from '../state/navigationStore'
import { useReducedMotion } from './useReducedMotion'

// The one door into the CV, shared by the star and the chevrons above it.
// Reads the store directly rather than through a hook so the handler is a
// stable module function. warpToCv itself ignores clicks that land mid-
// transition, and the sound follows the state change rather than the click —
// see AudioDirector.
function startWarp() {
  useNavigationStore.getState().warpToCv()
}

// Constant uniform, allocated once — see the note at <ChromaticAberration>.
const CA_OFFSET = new Vector2(0.0006, 0.0009)

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
  const setSunHovered = useNavigationStore((s) => s.setSunHovered)
  const view = useNavigationStore((s) => s.view)
  const reducedMotion = useReducedMotion()

  // THE SINGLE BIGGEST PERFORMANCE WIN IN THE APP.
  //
  // The CV and the walkthrough are opaque and full-screen: while either is open
  // the scene is completely invisible. It was still rendering every frame —
  // six custom shaders, god rays at 30 samples, bloom, grain and tone mapping,
  // at up to 1.35x device pixels — against a document the visitor is trying to
  // read and scroll. That is where the reported lag inside the CV was coming
  // from: the reader was competing with a full 3D render for the GPU and the
  // compositor on every scroll frame.
  //
  // 'never' halts the render loop outright. Nothing needs a frame here: the
  // camera is parked, and the transitions that DO need frames (the dive, the
  // rise back out) only run while no panel is open. R3F resumes cleanly the
  // moment this flips back.
  const covered = useNavigationStore((s) => s.cvOpen || s.dossierOpen)

  const onDecline = useCallback(() => setDpr(isSmall ? 0.8 : 1), [isSmall])
  // Recovery must be symmetric. An earlier build only ever restored dpr while
  // permanently disabling effects, making the quality drop a one-way latch that
  // the scene could never climb back out of.
  const onIncline = useCallback(() => setDpr(isSmall ? 1.2 : 1.35), [isSmall])

  return (
    <Canvas
      frameloop={covered ? 'never' : 'always'}
      dpr={dpr}
      // far: the nebula is a BackSide sphere of radius 200, so the furthest
      // thing that must stay visible is its far inner wall — (camera distance
      // from origin) + 200. At 400 this clipped the moment the camera moved
      // any distance out, punching a black disc through the middle of the frame
      // while the edges, whose intersections are nearer, still rendered. 700
      // covers the whole shell from anywhere inside it, with room to spare.
      camera={{ position: [0, 11, 27], fov: 46, near: 0.1, far: 700 }}
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

        <Sun onReady={setSunMesh} onStart={startWarp} onSunHover={setSunHovered} />
        {/* Three chevrons above the star, pointing at it. They replaced the
            "Start Here" sign that used to stand behind it: same invitation,
            no lettering, and roughly a thousandth of the screen area. Clicking
            them is the same door as clicking the star, and hovering them lights
            the star — which is how they say what they are pointing at. */}
        <SunCue onStart={startWarp} onHover={setSunHovered} />
        <Rocket />

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
      {/* StarDive must precede Wormhole: both run at the default frame
          priority, so they execute in mount order, and the wormhole rides the
          camera StarDive has just moved. Ordering is the whole mechanism here —
          R3F disables its automatic render as soon as any useFrame declares a
          non-zero priority, so sequencing by priority number is not an option.
          StarDive owns the camera for the warp in and the rise back out. */}
      <StarDive />
      {/* The warp's star streaks. Always mounted, and hidden outright
          (`visible = false`) at rest, so outside the warp it costs nothing and
          never changes the composer's shape. */}
      <Wormhole count={isSmall ? 380 : 900} reducedMotion={reducedMotion} />
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
            /* The most expensive thing in the chain: a full-screen pass that
               walks this many texture samples per pixel, every frame. Halving
               it on a phone is the largest single saving available there, and
               at the shaft weight used below the difference is not visible —
               these are soft gradients, not detail. Read once at mount from a
               value that never changes, so the shader is compiled exactly once;
               varying this at runtime is the chain-rebuild the note above
               warns about. */
            samples={isSmall ? 16 : 30}
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
          /* Hoisted to module scope. A fresh Vector2 here is a new prop
             identity on every Scene render, and Scene re-renders whenever the
             dpr monitor adjusts resolution — which hands the effect a changed
             uniform object during exactly the frames it is trying to recover
             performance. */
          offset={CA_OFFSET}
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
