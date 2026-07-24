import { Stars } from '@react-three/drei'

// Two star layers for parallax depth: a bright near field of larger, twinkling
// stars, and a dense, dim far field that reads as the deep background haze.
// Paired with the <Nebula> backdrop, this gives the sky real depth rather than
// a flat sprinkle of dots.
export default function Starfield() {
  return (
    <>
      <Stars radius={120} depth={50} count={2600} factor={4} saturation={0} fade speed={0.5} />
      <Stars radius={180} depth={80} count={5000} factor={2} saturation={0} fade speed={0.2} />
    </>
  )
}
