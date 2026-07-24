import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useProgress } from '@react-three/drei'
import { useReducedMotion } from '../scene/useReducedMotion'

// A short cold-open while the scene compiles. It's not a gate — there's no
// "enter" button to click, because a hiring manager with thirty seconds
// shouldn't have to ask permission to see the work. It clears itself the
// moment the system is ready.
const LINES = [
  'Locking orbital reference · Jovian system',
  'Loading mission set · 3 projects, 1 station',
  'Handing control to visitor',
]

export default function BootSequence() {
  const { active, progress } = useProgress()
  const [done, setDone] = useState(false)
  const [visibleLines, setVisibleLines] = useState(0)
  const rootRef = useRef()
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) {
      setVisibleLines(LINES.length)
      return
    }
    const timers = LINES.map((_, i) =>
      setTimeout(() => setVisibleLines(i + 1), 260 + i * 320)
    )
    return () => timers.forEach(clearTimeout)
  }, [reducedMotion])

  useEffect(() => {
    // This scene loads zero async assets — every texture is a procedural
    // CanvasTexture — so drei's useProgress never climbs to 100 and `active`
    // never flips. We can't wait on a signal that will never fire. Instead we
    // dismiss on a fixed minimum hold (the scene compiles well inside it), and
    // treat any real loader progress as a bonus that can only end things
    // sooner. The result: the boot cover is guaranteed to lift.
    const ready = !active && (progress >= 100 || progress === 0)
    const minimum = reducedMotion ? 200 : 1600
    const timer = setTimeout(() => {
      if (!ready) return
      const el = rootRef.current
      if (!el) return setDone(true)
      gsap.to(el, {
        opacity: 0,
        duration: reducedMotion ? 0.01 : 0.7,
        ease: 'power2.inOut',
        onComplete: () => setDone(true),
      })
    }, minimum)
    return () => clearTimeout(timer)
  }, [active, progress, reducedMotion])

  if (done) return null

  return (
    <div className="boot" ref={rootRef} role="status" aria-live="polite">
      <div className="boot__inner">
        <p className="boot__mark mono">GANYMEDE-0</p>
        <ul className="boot__lines mono">
          {LINES.slice(0, visibleLines).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="boot__bar" aria-hidden="true">
          {/* Real loader progress is meaningless here (no async assets), so the
              fill is time-driven via CSS to mirror the compile hold. */}
          <span className="boot__fill" />
        </div>
      </div>
    </div>
  )
}
