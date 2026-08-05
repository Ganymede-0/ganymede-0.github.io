import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { computeFraming, framing } from './framing'
import { useNavigationStore } from '../state/navigationStore'

// Keeps the camera framed for the current canvas size — on first paint, on
// window resize, and on device rotation.
//
// It only MOVES the camera while in the overview. If the visitor is parked at a
// body (or mid-flight), a resize updates the stored framing for the eventual
// return trip but leaves the live camera alone: yanking someone's viewpoint
// because a mobile browser's address bar collapsed would be worse than a
// slightly imperfect frame.
export default function ResponsiveFraming() {
  const { camera, size } = useThree()
  const stage = useNavigationStore((s) => s.stage)
  const view = useNavigationStore((s) => s.view)

  useEffect(() => {
    if (!size.width || !size.height) return

    computeFraming(size.width, size.height)

    // fov and aspect must be applied to the camera object itself; R3F handles
    // aspect, but a changed fov needs the projection matrix rebuilt.
    if (camera.fov !== framing.fov) {
      camera.fov = framing.fov
      camera.updateProjectionMatrix()
    }

    // During the approach the flight recomputes the camera from scroll every
    // frame, and does so in terms of the framing distance updated just above —
    // so it is already responsive. Writing the final framing position here as
    // well would fight it for one frame on every resize, which on a phone means
    // every time the address bar collapses.
    if (stage === 'system' && view === 'overview') {
      camera.position.copy(framing.position)
      camera.lookAt(0, 0, 0)
    }
  }, [camera, size.width, size.height, stage, view])

  return null
}
