// Shared warp intensity — written by StarDive during the fall into the star,
// read by Wormhole every frame.
//
// A plain module object rather than store state, for the same reason as
// orbitClock: it changes every frame of the transition, and putting it in a
// store would re-render the tree at display rate for a value only two
// components ever read.
export const warp = {
  /** 0 = at rest (wormhole not drawn at all), 1 = full warp. */
  level: 0,
}
