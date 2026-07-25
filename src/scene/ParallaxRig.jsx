import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// Mouse-parallax for the deep background (nebula, starfields, dust). The far
// layers tilt a few hundredths of a radian against the pointer with heavy
// damping, so space itself has inertia — the depth cue you feel rather than
// see. Deliberately NOT applied to the orbital system: the camera rig derives
// its focus framing from live world positions, and a parallax offset on the
// bodies would fight that math. Background-only is the classic film trick
// anyway — distant layers move against the near ones.
export default function ParallaxRig({ children }) {
  const ref = useRef()

  useFrame((state, delta) => {
    const g = ref.current
    if (!g) return
    const tx = -state.pointer.y * 0.035
    const ty = state.pointer.x * 0.05
    // Frame-rate independent damping toward the target tilt.
    const k = 1 - Math.exp(-delta * 2.2)
    g.rotation.x += (tx - g.rotation.x) * k
    g.rotation.y += (ty - g.rotation.y) * k
  })

  return <group ref={ref}>{children}</group>
}
