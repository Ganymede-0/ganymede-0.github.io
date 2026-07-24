import { Environment, Lightformer } from '@react-three/drei'

// -----------------------------------------------------------------------------
// The light rig. Two jobs, kept separate on purpose:
//
//   1. Direct lights (below) model the *drama* — the warm core throwing light
//      outward, a cool key raking across the system, a faint back-rim so no
//      body ever dissolves into the background.
//   2. A baked image-based environment (the <Environment> block) models the
//      *reflections*. This is the piece the old scene was missing: a metal
//      surface with nothing to reflect renders black. The station's hull is
//      85% metal, so without this it was invisible by definition. The
//      lightformers give every metal and dielectric a real world to mirror.
//
// The environment is baked once (frames={1}) into a 256px cube — effectively
// free after the first frame — and never drawn as a background, so our deep
// #05070d void stays intact.
// -----------------------------------------------------------------------------
export default function Lighting() {
  return (
    <>
      {/* Soft global floor so shadow-side geometry never crushes to pure black */}
      <ambientLight intensity={0.28} />
      <hemisphereLight args={['#9fb8ff', '#140b06', 0.55]} />

      {/* Cool key, raking in from upper-left — this is what actually sculpts
          the spheres and reads them as lit worlds rather than flat discs. */}
      <directionalLight position={[-8, 12, 8]} intensity={1.35} color="#dfe9ff" />

      {/* Warm counter-fill from the opposite side, tying the planets back to
          the amber core so the palette stays coherent across the system. */}
      <directionalLight position={[10, -4, -6]} intensity={0.5} color="#ffb877" />

      {/* Faint rim from behind camera-left, for limb separation against fog. */}
      <pointLight position={[-14, 6, -18]} intensity={40} distance={70} decay={2} color="#6fe7dc" />

      <Environment resolution={256} frames={1} background={false}>
        {/* A dim, cool room so nothing reflects garish white */}
        <color attach="background" args={['#05070d']} />

        {/* Broad cool ceiling panel — the dominant reflection on metal hulls */}
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#cfe0ff"
          position={[0, 8, 2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[18, 18, 1]}
        />
        {/* Warm side strip — matches the Jovian core, adds a gold edge to metals */}
        <Lightformer
          form="rect"
          intensity={3}
          color="#ffb877"
          position={[10, 2, 4]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[10, 6, 1]}
        />
        {/* Cyan accent strip on the opposite flank — the data/ice signature */}
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#6fe7dc"
          position={[-10, -1, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[10, 6, 1]}
        />
        {/* Small hot ring standing in for the core, for a tight spec highlight */}
        <Lightformer
          form="ring"
          intensity={4}
          color="#ffe6c2"
          position={[0, 0, 6]}
          scale={[3, 3, 1]}
        />
      </Environment>
    </>
  )
}
