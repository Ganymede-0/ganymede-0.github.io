import { useRef, useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import { orbitClock, bodyRegistry } from './orbitClock'
import { framing, OVERVIEW_TARGET } from './framing'
import { useNavigationStore } from '../state/navigationStore'
import { useReducedMotion } from './useReducedMotion'

export default function CameraRig() {
  const controlsRef = useRef()
  const tweenRef = useRef(null)
  const { camera, size } = useThree()

  const stage = useNavigationStore((s) => s.stage)
  const view = useNavigationStore((s) => s.view)
  const activeId = useNavigationStore((s) => s.activeId)
  const arrivedAtBody = useNavigationStore((s) => s.arrivedAtBody)
  const arrivedAtOverview = useNavigationStore((s) => s.arrivedAtOverview)
  const reducedMotion = useReducedMotion()

  // Zoom-out limit must clear the framed overview distance, which on a narrow
  // viewport is far larger than the old fixed 46. OrbitControls clamps the
  // camera on every update(), so a too-small maxDistance silently drags the
  // camera back in and undoes the responsive framing. Recomputed on resize.
  const maxDistance = useMemo(
    () => Math.max(50, framing.distance * 1.45),
    [size.width, size.height]
  )

  // OrbitControls needs an explicit update() each frame once damping is on.
  useFrame(() => {
    if (controlsRef.current) controlsRef.current.update()
  })

  useEffect(() => {
    if (stage !== 'system') return
    if (view !== 'transitioning') return
    const controls = controlsRef.current
    if (!controls) return

    // Hand the camera over to GSAP for the duration of the flight.
    controls.enabled = false
    tweenRef.current?.kill()

    const duration = reducedMotion ? 0.01 : 1.5
    const tl = gsap.timeline({
      defaults: { duration, ease: 'power3.inOut' },
      onComplete: () => {
        controls.enabled = true
        activeId ? arrivedAtBody() : arrivedAtOverview()
      },
    })
    tweenRef.current = tl

    if (activeId) {
      const body = bodyRegistry.get(activeId)
      if (!body) {
        controls.enabled = true
        arrivedAtBody()
        return
      }

      // Read the body's live world position, then park the camera slightly
      // above and outside it.
      const bodyPos = new THREE.Vector3()
      body.getWorldPosition(bodyPos)

      const outward = bodyPos.clone().normalize()
      const camPos = bodyPos
        .clone()
        .add(outward.multiplyScalar(3.6))
        .add(new THREE.Vector3(0, 1.5, 2.6))

      // Frame the body on the LEFT of the viewport so it balances the mission
      // panel on the right. We do this by aiming the camera's TARGET to the
      // right of the body: the camera rotates right, the body slides left.
      //
      // The offset is derived, not eyeballed. At the camera's distance the
      // frustum half-width is `tan(fov/2) * dist * aspect`. The panel covers
      // the right ~42vw, so the visible area is the left ~58% and its centre
      // sits at normalised x ≈ -0.42. Shifting the target by 0.42 * halfWidth
      // along the camera-right vector lands the body dead-centre of that gap.
      const target = bodyPos.clone()
      // Only offset when a SIDE panel is actually covering the right of the
      // screen. In the compact layout the panel is a bottom sheet, so pushing
      // the body left would just shove it off the edge of a phone.
      if (framing.sidePanel) {
        const camDist = camPos.distanceTo(bodyPos)
        const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) * camDist
        const halfW = halfH * camera.aspect
        const viewDir = bodyPos.clone().sub(camPos).normalize()
        const right = new THREE.Vector3().crossVectors(viewDir, camera.up).normalize()
        target.add(right.multiplyScalar(halfW * 0.42))
      }

      // Everything decelerates together: the system stops turning as you
      // arrive, so the planet you selected holds still while you read.
      tl.to(orbitClock, { scale: 0, duration: duration * 0.8 }, 0)
      tl.to(camera.position, { x: camPos.x, y: camPos.y, z: camPos.z }, 0)
      tl.to(controls.target, { x: target.x, y: target.y, z: target.z }, 0)
    } else {
      // Read the CURRENT framing, not a constant — the viewport may have been
      // resized or rotated while the visitor was parked at a body.
      tl.to(orbitClock, { scale: 1, duration: duration * 1.1 }, 0)
      tl.to(camera.position, { ...framing.position }, 0)
      tl.to(controls.target, { ...OVERVIEW_TARGET }, 0)
    }

    return () => {
      tl.kill()
    }
  }, [stage, view, activeId, camera, arrivedAtBody, arrivedAtOverview, reducedMotion])

  // During the approach the prologue owns the camera outright, and OrbitControls
  // must not merely be disabled — it must not exist. Its update() clamps the
  // camera between minDistance and maxDistance on every call regardless of
  // `enabled`, and the flight legitimately starts several times further out
  // than maxDistance. Leaving it mounted would silently drag the camera back in
  // and flatten the entire approach.
  //
  // Remounting on arrival is free and lands correctly: a fresh OrbitControls
  // targets the origin, which is exactly OVERVIEW_TARGET and exactly where the
  // approach was already looking.
  if (stage !== 'system') return null

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      enablePan={false}
      minDistance={4}
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI * 0.85}
      minPolarAngle={Math.PI * 0.08}
      rotateSpeed={0.5}
      zoomSpeed={0.7}
      autoRotate={view === 'overview'}
      autoRotateSpeed={reducedMotion ? 0 : 0.22}
    />
  )
}
