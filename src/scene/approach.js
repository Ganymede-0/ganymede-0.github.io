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
