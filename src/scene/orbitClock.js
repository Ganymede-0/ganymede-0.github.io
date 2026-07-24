// A module-level clock shared by every orbiting body.
//
// Why not React state: orbital position updates every frame. Putting it in
// state would re-render the whole tree 60x/second. Instead every body reads
// `orbitClock.elapsed` inside useFrame, and the camera rig tweens
// `orbitClock.scale` with GSAP — so when you fly toward a project, the whole
// system decelerates to a standstill around you, and spins back up when you
// return to the overview. That deceleration is the transition, not a
// side effect of it.
export const orbitClock = {
  elapsed: 0,
  scale: 1,
}

// id -> THREE.Object3D, so the camera rig can read a body's *current* world
// position at the moment it's clicked without threading refs through props.
export const bodyRegistry = new Map()
