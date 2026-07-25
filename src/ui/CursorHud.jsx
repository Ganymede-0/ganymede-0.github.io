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

  useEffect(() => {
    const root = rootRef.current
    const coords = coordsRef.current
    if (!root || !coords) return

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
      // Damped chase — the lag is the character.
      pos.x += (target.x - pos.x) * 0.16
      pos.y += (target.y - pos.y) * 0.16
      root.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`

      // Interactive flare. `elementFromPoint` forces the browser to run a hit
      // test against the whole document — doing that every frame was competing
      // with the render loop for main-thread time. 10Hz is imperceptible for a
      // hover state and costs a sixth as much.
      if (now - hitTestAt > 100) {
        hitTestAt = now
        const el = document.elementFromPoint(target.x, target.y)
        const next =
          document.body.style.cursor === 'pointer' ||
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
      <span className="cursor-hud__ring" />
      <span className="cursor-hud__coords" ref={coordsRef} />
    </div>
  )
}
