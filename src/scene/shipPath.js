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
// a dive through a gap in the lettering — cross-faded by a smooth weight. Each
// half was smooth on its own, and the fade was smooth, and the result still
// snapped. The reason is that a cross-fade blends POSITIONS, not motion: the two
// curves were travelling at different speeds and in different directions at the
// moment the weight moved, so the blended velocity swung hard over a short
// stretch of the loop. A smooth blend of two smooth paths is smooth in position
// and can still be violent in velocity. That was the jerk.
//
// WHAT THIS IS
// A single closed ellipse lying in a tilted plane:
//
//     x(t) = cx + rx * cos t
//     y(t) = cy + ty * cos t      <- y is linear in x, so the orbit is planar
//     z(t) = cz + rz * sin t
//
// An ellipse has no joins, no blend and no pieces. Its curvature varies smoothly
// and gently around the entire loop by definition, so there is nothing left that
// CAN snap. Travelled at constant arc length, the motion is as smooth as motion
// gets.
//
// WHAT IT IS ANCHORED TO
// It used to be built from the position of the "Start Here" sign — the far point
// of the orbit was placed a fixed clearance in front of it, so the rocket swept
// across the word gap without ever passing behind a letter. The sign is gone
// (see SunCue), so the geometry that survived it is written out here directly:
// the same ellipse, in the same place, at the same size, now expressed as what
// it always was — an orbit around the system, inclined out of the ecliptic and
// swinging close past the viewer on the near side.
//
// The numbers are the ones the flight was tuned and verified at. They are not
// derived from anything any more, which is the point: there is no longer a
// second object whose position can move this one.
// -----------------------------------------------------------------------------

/** Centre of the ellipse. x sits on the system's axis; y lifts the whole orbit
 *  slightly above the ecliptic so it never runs flat through the planets. */
const CENTER_X = 0
const CENTER_Y = 1.4

/** The two ends of the z sweep: how far back the orbit reaches behind the star,
 *  and how close it comes to the camera. NEAR_Z is the knob for "make it bigger
 *  as it passes" — the rocket's own scaling is measured from whatever range
 *  these two produce. */
const FAR_Z = -7.9
const NEAR_Z = 19

/** Half-width in x. Comfortably outside the outermost planet (13.5), so the
 *  rocket never flies through a body. */
const RADIUS_X = 17

/** Rise from one side of the loop to the other. It is what stops the path
 *  reading as a flat ring on a table. */
const TILT_Y = 3.2

/** Samples handed to the spline. Dense and evenly spaced in the parameter,
 *  which for an ellipse means evenly spaced in shape too. */
const SAMPLES = 256

/** Build the closed flight path. */
export function buildShipPath() {
  const rz = (NEAR_Z - FAR_Z) / 2
  const cz = FAR_Z + rz

  const points = []
  for (let i = 0; i < SAMPLES; i++) {
    const t = (Math.PI * 2 * i) / SAMPLES
    points.push(
      new THREE.Vector3(
        CENTER_X + RADIUS_X * Math.cos(t),
        CENTER_Y + TILT_Y * Math.cos(t),
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

  return curve
}
