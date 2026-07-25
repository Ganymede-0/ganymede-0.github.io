import { Stars } from '@react-three/drei'

// Two star layers for parallax depth: a bright near field of larger, twinkling
// stars, and a dense, dim far field that reads as the deep background haze.
// Paired with the <Nebula> backdrop, this gives the sky real depth rather than
// a flat sprinkle of dots.
export default function Starfield() {
  return (
    <>
      {/* Near field: fewer, larger, brighter — these are the stars that cross
          the bloom threshold and bleed, giving the sky its sparkle. */}
      <Stars radius={120} depth={50} count={2200} factor={6} saturation={0} fade speed={0.6} />
      {/* Far field: dense and fine, read as the background haze. */}
      <Stars radius={180} depth={80} count={5200} factor={2.6} saturation={0} fade speed={0.2} />
    </>
  )
}
