import { Stars } from '@react-three/drei'

// A cheap, single-draw-call starfield. Kept as one <Stars> instance —
// stacking several (a common tutorial pattern) roughly multiplies the cost
// for a marginal visual gain, so we lean on one dense field instead.
export default function Starfield() {
  return (
    <Stars
      radius={140}
      depth={60}
      count={4200}
      factor={3.2}
      saturation={0}
      fade
      speed={0.4}
    />
  )
}
