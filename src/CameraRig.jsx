import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import { orbitClock, bodyRegistry } from './orbitClock'
import { useNavigationStore } from '../state/navigationStore'
import { useReducedMotion } from './useReducedMotion'

const OVERVIEW_POSITION = new THREE.Vector3(0, 11, 27)
const OVERVIEW_TARGET = new THREE.Vector3(0, 0, 0)

export default function CameraRig() {
  const controlsRef = useRef()
  const tweenRef = useRef(null)
  const { camera } = useThree()

  const view = useNavigationStore((s) => s.view)
  const activeId = useNavigationStore((s) => s.activeId)
  const arrivedAtBody = useNavigationStore((s) => s.arrivedAtBody)
  const arrivedAtOverview = useNavigationStore((s) => s.arrivedAtOverview)
  const reducedMotion = useReducedMotion()

  // OrbitControls needs an explicit update() each frame once damping is on.
  useFrame(() => {
    if (controlsRef.current) controlsRef.current.update()
  })

  useEffect(() => {
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
      // above and outside it — off-center, so the mission panel on the right
      // never covers the planet it's describing.
      const bodyPos = new THREE.Vector3()
      body.getWorldPosition(bodyPos)

      const outward = bodyPos.clone().normalize()
      const camPos = bodyPos
        .clone()
        .add(outward.multiplyScalar(3.6))
        .add(new THREE.Vector3(0, 1.5, 2.6))

      // Everything decelerates together: the system stops turning as you
      // arrive, so the planet you selected holds still while you read.
      tl.to(orbitClock, { scale: 0, duration: duration * 0.8 }, 0)
      tl.to(camera.position, { x: camPos.x, y: camPos.y, z: camPos.z }, 0)
      tl.to(controls.target, { x: bodyPos.x, y: bodyPos.y, z: bodyPos.z }, 0)
    } else {
      tl.to(orbitClock, { scale: 1, duration: duration * 1.1 }, 0)
      tl.to(camera.position, { ...OVERVIEW_POSITION }, 0)
      tl.to(controls.target, { ...OVERVIEW_TARGET }, 0)
    }

    return () => {
      tl.kill()
    }
  }, [view, activeId, camera, arrivedAtBody, arrivedAtOverview, reducedMotion])

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      enablePan={false}
      minDistance={4}
      maxDistance={46}
      maxPolarAngle={Math.PI * 0.85}
      minPolarAngle={Math.PI * 0.08}
      rotateSpeed={0.5}
      zoomSpeed={0.7}
      autoRotate={view === 'overview'}
      autoRotateSpeed={reducedMotion ? 0 : 0.22}
    />
  )
}
