// Shared state for the approach sequence — the scroll-driven flight from deep
// space into the orbital system.
//
// Why a module object rather than React state: scroll fires at display rate,
// and the camera reads it every frame. Putting `progress` in a store would
// re-render the tree on every scroll event, which on a page already running six
// custom shaders is exactly the wrong place to spend a frame. The Prologue
// writes here; ApproachRig and Wormhole read here. Same contract as orbitClock.
export const approach = {
  /** 0 = deep space, 1 = arrived at the system. Raw scroll fraction. */
  progress: 0,
  /** Eased flight progress — what the camera actually follows. */
  eased: 0,
  /** 0..1 wormhole intensity, ramping over the final stretch of the scroll. */
  warp: 0,
  /** True while the prologue owns the camera. CameraRig yields when set. */
  active: true,
}

/** Smooth Hermite ramp between two edges — the GLSL smoothstep, in JS. */
export function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

// The flight is front-loaded: most of the distance is covered early, so the
// last chapters read while the system is already large and legible on screen.
// A linear mapping instead spends the whole prologue with the system as a
// distant speck and then rushes the arrival.
export function easeApproach(p) {
  return 1 - Math.pow(1 - p, 2.4)
}

// Where the wormhole begins. Before this the flight is calm and the text is the
// subject; after it, motion takes over and reading stops being the point.
//
// Tuned against the actual scroll length. With five chapters plus the runway,
// the arrival chapter centres at roughly p = 0.83 — so this sits just above
// that, leaving the last beat legible and giving the whole wormhole to the
// runway, where there is no text left to compete with it.
export const WARP_START = 0.8

// -----------------------------------------------------------------------------
// THE INNER UNIVERSE — where the story is read.
//
// The story does not happen in the solar system. Clicking the star falls INTO
// it and comes out somewhere else: a quiet pocket of deep space with the system
// nowhere in sight. That separation is the point — it is why the narrative gets
// its own dark, uncluttered backdrop instead of competing with three orbiting
// planets for attention.
//
// PROLOGUE_RADIUS is bounded by two hard constraints, and violating either one
// is what produced the black disc in the middle of the frame:
//
//   * The nebula is a BackSide sphere of radius 200. Outside it, front faces
//     are culled and there is nothing to see.
//   * The camera's far plane is 400. A ray through screen centre reaches the
//     far inner wall of the shell at (radius + 200) units. At the old start
//     distance of 219 that was 419 — beyond the far plane, so the centre of
//     the screen clipped to black while the edges, whose intersections are
//     nearer, still rendered.
//
// At 112 the far wall sits at 312, comfortably inside the far plane, and the
// camera is deep enough inside the shell to be surrounded by gas on every side.
//
// It is also the distance that makes the system read as FAR AWAY rather than
// merely small: the outer orbit (radius 15) subtends about 7.6°, roughly a
// third of the frame's half-height. Recognisable, unmistakably distant, and
// never in competition with the words.
export const PROLOGUE_RADIUS = 112

// How far the camera closes over the whole read. Small on purpose: this is a
// slow current, not a journey. The scroll is carrying TEXT, and a camera making
// large moves underneath it turns reading into a chore.
export const PROLOGUE_DRIFT = 20

// How fast the orbits turn while the story is being read.
//
// NOT zero. The system stopping dead the moment the visitor leaves it makes the
// background a photograph, and a photograph behind a story about engineering
// systems is a wasted opportunity. Slowed to under half speed instead: still
// clearly alive at a glance, still calm enough that nothing in the periphery
// competes with a paragraph for attention.
export const PROLOGUE_ORBIT_SCALE = 0.42
