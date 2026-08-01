import * as THREE from 'three'

// -----------------------------------------------------------------------------
// Viewport-aware camera framing.
//
// A fixed camera position cannot work across devices. The horizontal field of
// view is derived from the VERTICAL fov and the aspect ratio:
//
//     tan(hFov/2) = tan(vFov/2) · aspect
//
// so as a viewport narrows, the horizontal view cone closes with it. A camera
// parked at a distance that frames the whole system on a 16:9 desktop will have
// the outer orbits far outside the frame on a 9:19 phone — the system silently
// crops, and on a phone the visitor sees a sun and nothing else.
//
// This module computes, for any viewport, the distance at which the system
// still fits, and the overview camera position that goes with it. Both the
// initial camera and the "return to overview" flight read from here, so they
// can never disagree.
// -----------------------------------------------------------------------------

// The direction the overview camera sits along, preserved from the original
// hand-authored composition ([0, 11, 27]). Only the DISTANCE adapts, so the
// shot's character — the angle you look down on the system from — is identical
// on every device.
const DIRECTION = new THREE.Vector3(0, 11, 27).normalize()

export const OVERVIEW_TARGET = new THREE.Vector3(0, 0, 0)

// Radius that should stay in frame: the outermost orbit (13.5) plus the body on
// it and a little air. On very tall/narrow viewports we frame a slightly
// tighter core instead — see below.
const SYSTEM_RADIUS = 15

// Live framing values. Mutated by <ResponsiveFraming>; read by CameraRig.
export const framing = {
  position: new THREE.Vector3(0, 11, 27),
  distance: 29.2,
  fov: 46,
  /** true when the UI has collapsed to the single-column / sheet layout */
  compact: false,
  /** true when a side panel occupies the right of the screen */
  sidePanel: true,
}

/**
 * Work out the camera framing for a given canvas size.
 * Returns the same object each call (no allocation in a resize handler).
 */
export function computeFraming(width, height) {
  const aspect = width / height
  const compact = width < 900
  const portrait = aspect < 1

  // A wider lens on small screens buys framing without pushing the camera so
  // far back that the planets shrink to specks.
  const fov = compact ? (portrait ? 60 : 52) : 46

  // On a portrait phone, insisting the entire outer orbit fits would force the
  // camera so far out that nothing is legible. Framing the inner system reads
  // better and still communicates the structure — the outer orbit runs off the
  // edge, which correctly implies the system continues.
  const radius = portrait ? SYSTEM_RADIUS * 0.78 : SYSTEM_RADIUS

  const vHalf = THREE.MathUtils.degToRad(fov) / 2
  const tanV = Math.tan(vHalf)

  // Distance needed for the radius to fit each axis.
  const distV = radius / tanV
  const distH = radius / (tanV * aspect)

  // The disc is viewed at a steep angle, so its vertical screen extent is
  // foreshortened and the horizontal fit is what actually binds. Weight
  // accordingly rather than taking a naive max, which over-pushes the camera.
  let distance = Math.max(distH, distV * 0.62) * 1.06

  // On desktop the project panel covers the right ~42% of the viewport, so the
  // system has to read inside the remaining width. This factor is also tuned so
  // a standard 16:9 desktop lands on ~29 units — the distance the composition
  // was originally authored at — meaning the desktop shot is unchanged and only
  // narrower viewports actually move.
  if (!compact) distance *= 1.26

  framing.distance = THREE.MathUtils.clamp(distance, 20, 78)
  framing.fov = fov
  framing.compact = compact
  framing.sidePanel = !compact
  framing.position.copy(DIRECTION).multiplyScalar(framing.distance)

  return framing
}

// The distance the composition was originally authored at.
const BASELINE_DISTANCE = 29.2

/**
 * drei's <Html distanceFactor> scales an element by roughly factor/distance, so
 * a fixed value shrinks the floating labels as the camera pulls back — exactly
 * what happens on a narrow viewport, where labels would end up unreadable on
 * the smallest screens. Scaling the factor with the framed distance holds their
 * apparent size roughly constant on every device.
 */
export function labelDistanceFactor(base = 16) {
  return base * (framing.distance / BASELINE_DISTANCE)
}
