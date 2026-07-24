import { useMemo } from 'react'
import * as THREE from 'three'

// The orbit ellipse. Drawn as a dashed line so it reads as a *plotted*
// trajectory (a chart on a star map) rather than a decorative hoop —
// and because the dash pattern is what the mission panel's header rule
// picks up when a body is selected.
export default function OrbitPath({ radius, tilt = 0, color = '#232c47', active = false }) {
  const geometry = useMemo(() => {
    const segments = 180
    const points = []
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [radius])

  const material = useMemo(
    () =>
      new THREE.LineDashedMaterial({
        color: new THREE.Color(color),
        dashSize: 0.42,
        gapSize: 0.3,
        transparent: true,
        opacity: active ? 0.75 : 0.32,
      }),
    [color, active]
  )

  const line = useMemo(() => {
    const l = new THREE.Line(geometry, material)
    l.computeLineDistances() // required for dashes to appear
    return l
  }, [geometry, material])

  return <primitive object={line} rotation={[tilt, 0, tilt * 0.5]} />
}
