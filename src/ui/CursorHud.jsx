import { useEffect, useRef } from 'react'

// A terminal reticle that trails the pointer: a damped ring with live
// normalized coordinates, flaring open over anything interactive. The native
// cursor stays — this is an instrument overlay, not a replacement, so nothing
// about usability is gambled for the aesthetic. Desktop-pointer only; the CSS
// removes it entirely on touch devices.
//
// Implementation notes: everything runs outside React state — mousemove writes
// to refs, one rAF loop applies transforms directly. Zero re-renders.
export default function CursorHud() {
  const rootRef = useRef()
  const coordsRef = useRef()
  const dotRef = useRef()

  useEffect(() => {
    const root = rootRef.current
    const coords = coordsRef.current
    const ring = root?.querySelector('.cursor-hud__ring')
    if (!root || !coords || !ring) return

    const target = { x: -100, y: -100 }
    const pos = { x: -100, y: -100 }
    let visible = false
    let raf

    const onMove = (e) => {
      target.x = e.clientX
      target.y = e.clientY
      if (!visible) {
        visible = true
        root.classList.add('is-visible')
      }
    }
    const onLeave = (e) => {
      if (!e.relatedTarget) {
        visible = false
        root.classList.remove('is-visible')
      }
    }

    let lastCoordText = ''
    let engaged = false
    let hitTestAt = 0

    const loop = (now) => {
      // The ROOT tracks the pointer exactly — the dot must never lie about
      // where a click will land, because this element replaces the native
      // cursor entirely. Only the RING is damped, trailing behind on its own
      // offset. That gives the motion its weight without costing precision.
      pos.x += (target.x - pos.x) * 0.18
      pos.y += (target.y - pos.y) * 0.18
      root.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`
      ring.style.transform = `translate3d(${pos.x - target.x}px, ${pos.y - target.y}px, 0)`

      // Interactive flare. `elementFromPoint` forces the browser to run a hit
      // test against the whole document — doing that every frame was competing
      // with the render loop for main-thread time. 10Hz is imperceptible for a
      // hover state and costs a sixth as much.
      if (now - hitTestAt > 100) {
        hitTestAt = now
        const el = document.elementFromPoint(target.x, target.y)
        const next =
          document.body.classList.contains('is-pointing') ||
          !!(el && el.closest('a, button'))
        if (next !== engaged) {
          engaged = next
          root.classList.toggle('is-engaged', next)
        }
      }

      // Live normalized coordinates, terminal-style. Only touch the DOM when
      // the rounded value actually changes.
      const nx = (target.x / window.innerWidth).toFixed(3)
      const ny = (target.y / window.innerHeight).toFixed(3)
      const text = `${nx} · ${ny}`
      if (text !== lastCoordText) {
        lastCoordText = text
        coords.textContent = text
      }

      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseout', onLeave)
    raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseout', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="cursor-hud" ref={rootRef} aria-hidden="true">
      {/* An orbital navigation reticle: a body at the centre with a satellite
          tracing an inclined orbit around it, inside a slowly precessing
          survey ring. The whole thing is one SVG so the arcs stay crisp at any
          scale, and it locks into a bracketed target when over something
          interactive. */}
      <svg className="cursor-hud__ring" viewBox="0 0 64 64" width="64" height="64">
        {/* Survey ring — dashed, counter-rotating */}
        <circle className="cursor-hud__survey" cx="32" cy="32" r="21" />
        {/* Inclined orbit path + its satellite */}
        <g className="cursor-hud__orbit">
          <ellipse cx="32" cy="32" rx="27" ry="10" />
          <circle className="cursor-hud__sat" cx="59" cy="32" r="1.9" />
        </g>
      </svg>

      {/* Corner brackets — snap in on engage */}
      <span className="cursor-hud__bracket cursor-hud__bracket--tl" />
      <span className="cursor-hud__bracket cursor-hud__bracket--tr" />
      <span className="cursor-hud__bracket cursor-hud__bracket--bl" />
      <span className="cursor-hud__bracket cursor-hud__bracket--br" />

      <span className="cursor-hud__dot" ref={dotRef} />
      <span className="cursor-hud__coords" ref={coordsRef} />
    </div>
  )
}
