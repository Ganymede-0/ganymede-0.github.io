import * as THREE from 'three'

// -----------------------------------------------------------------------------
// THE FLIGHT PATH — one inclined ellipse. Nothing else.
//
// WHAT WAS WRONG, TWICE
// The first version was fifteen typed-in control points, spaced two units apart
// near the lettering and fifteen apart out in the sweep. A spline through points
// at wildly different spacings has wildly different curvature between them, and
// curvature is what the eye reads as TURNING.
//
// The second version replaced that with two smooth functions — a wide orbit and
// a dive through the word gap — cross-faded by a smooth weight. Each half was
// smooth on its own, and the fade was smooth, and the result still snapped at
// the lettering. The reason is that a cross-fade blends POSITIONS, not motion:
// the two curves were travelling at different speeds and in different
// directions at the moment the weight moved, so the blended velocity swung hard
// over a short stretch of the loop. A smooth blend of two smooth paths is
// smooth in position and can still be violent in velocity. That is the jerk.
//
// WHAT THIS IS
// A single closed ellipse lying in a tilted plane:
//
//     x(t) = gx + rx * cos t
//     y(t) = gy + hy * cos t      <- y is linear in x, so the orbit is planar
//     z(t) = cz + rz * sin t
//
// An ellipse has no joins, no blend and no pieces. Its curvature varies
// smoothly and gently around the entire loop by definition, so there is nothing
// left that CAN snap. Travelled at constant arc length, the motion is as smooth
// as motion gets.
//
// WHERE IT SITS
// cz is chosen so the furthest point of the orbit sits exactly CLEARANCE in
// front of the sign, at the word gap. At that moment (t = -PI/2) the rocket is
// in the opening, travelling parallel to the lettering — it sweeps across the
// gap rather than punching through it. Half a lap later (t = +PI/2) it is at
// the same x and y but at the front of the orbit: closest to the viewer, and at
// its largest.
//
// Because z never goes below the sign's plane, the rocket cannot pass behind a
// letter — which is why this file no longer needs the ink audit the blended
// version required.
// -----------------------------------------------------------------------------

/** How far IN FRONT of the sign the orbit's furthest point sits. Positive, so
 *  the rocket is never coplanar with the lettering: at zero the two would fight
 *  for the same depth and flicker against each other. */
const CLEARANCE = 1.1

/** How close to the camera the front of the orbit reaches. Larger = the rocket
 *  passes nearer the viewer and reads bigger. */
const NEAR_Z = 19

/** Half-width of the orbit in x. Comfortably outside the outermost planet
 *  (13.5) so the rocket never flies through a body. */
const RADIUS_X = 17

/** Vertical tilt of the orbit plane: the rise from one side of the loop to the
 *  other. It is what stops the path reading as a flat ring on a table. */
const TILT_Y = 3.2

/** Samples handed to the spline. Dense and evenly spaced in the parameter,
 *  which for an ellipse means evenly spaced in shape too. */
const SAMPLES = 256

/**
 * Build the closed flight path.
 * @param {{position: THREE.Vector3, radius: number}} gate the opening in the
 *        lettering, used to aim the orbit's far point.
 */
export function buildShipPath(gate) {
  if (!gate) return null

  const gx = gate.position.x
  const gy = gate.position.y
  const signZ = gate.position.z

  const farZ = signZ + CLEARANCE
  const rz = (NEAR_Z - farZ) / 2
  const cz = farZ + rz

  const points = []
  for (let i = 0; i < SAMPLES; i++) {
    const t = (Math.PI * 2 * i) / SAMPLES
    points.push(
      new THREE.Vector3(
        gx + RADIUS_X * Math.cos(t),
        gy + TILT_Y * Math.cos(t),
        cz + rz * Math.sin(t)
      )
    )
  }

  // Centripetal parameterisation cannot cusp or overshoot between samples. With
  // points this evenly spaced on a true ellipse the spline is indistinguishable
  // from the ellipse itself; it is used for the arc-length table and the Frenet
  // frames it provides for free.
  const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5)
  curve.arcLengthDivisions = 1500
  curve.updateArcLengths()

  if (import.meta.env.DEV) {
    let minZ = Infinity
    const probe = new THREE.Vector3()
    for (let i = 0; i <= 600; i++) {
      curve.getPointAt(i / 600, probe)
      if (probe.z < minZ) minZ = probe.z
    }
    if (minZ < signZ) {
      console.warn(
        '[Rocket] orbit reaches z=' + minZ.toFixed(2) + ', behind the sign at ' + signZ
      )
    } else {
      console.info(
        '[Rocket] single ellipse; closest approach to the sign ' +
          (minZ - signZ).toFixed(2) +
          ' units in front, nearest the camera at z=' +
          NEAR_Z
      )
    }
  }

  return curve
}
