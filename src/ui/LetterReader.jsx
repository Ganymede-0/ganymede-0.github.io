import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigationStore } from '../state/navigationStore'
import { getProjectById } from '../data/projects'
import { useReducedMotion } from '../scene/useReducedMotion'

// -----------------------------------------------------------------------------
// THE LETTER READER — one page, full screen, inside the site.
//
// WHY NOT AN <iframe> OR <embed> OF THE PDF
// Three reasons, each sufficient on its own. The PDF is private and never
// deployed, so there is no PDF to embed. Browser PDF viewers are inconsistent to
// the point of absence on phones: iOS Safari shows a static first page with no
// zoom inside a frame, and several Android browsers simply offer a download —
// which is the "new window" this reader exists to avoid. And a PDF viewer brings
// its own grey toolbar into a site whose every surface is designed.
//
// So the page is an image, and the reading is done here:
//   - it opens fitted to a comfortable reading width, not to the screen height,
//     so on a desktop the text is legible before anyone touches a control;
//   - pinch, double-tap, ctrl/⌘+wheel and trackpad pinch zoom AROUND THE POINT
//     under the fingers or the pointer, which is what makes zoom feel like
//     looking closer rather than like the page jumping somewhere else;
//   - dragging pans, with a little momentum on touch; the wheel scrolls;
//   - + / − / 0 and the toolbar do the same for keyboards and mice.
//
// HOW ZOOM IS DONE
// Not with a CSS transform. Scaling an element does not change its layout box,
// so the scroll container would not know the page had grown and the zoomed page
// could not be scrolled to its edges. Instead the page is laid out at its real
// zoomed size inside a scroll container, and the scroll position is corrected
// in the same frame so the anchor point stays put. Native scrolling then does
// the rest: scrollbars, wheel, keyboard, and the browser's own clamping at the
// edges.
//
// The sizes are written to the DOM directly rather than through React state.
// A pinch produces a size change per pointer event; routing that through a
// render would put a reconciliation between every finger movement and the
// pixels, and the scroll correction has to read the new layout synchronously
// anyway. React owns what the reader SAYS; this code owns where the page IS.
// -----------------------------------------------------------------------------

const BASE = import.meta.env.BASE_URL

/** The widest the page is fitted to. At this width the letter's body text
 *  renders at roughly 16px — a normal reading size — so a desktop visitor can
 *  read it without zooming at all. */
const MAX_FIT = 880

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const STEP = 1.25

/** Where a double-tap takes you. Further on a phone, where "fit" is a 360px
 *  page and the text is too small to read until it is enlarged. */
const DOUBLE_TAP_ZOOM_NARROW = 2.6
const DOUBLE_TAP_ZOOM_WIDE = 2

/** A tap has to be short and nearly still, and a double-tap has to land close
 *  to the first; otherwise it was the start of a pan. */
const TAP_MS = 280
const TAP_SLOP = 10
const DOUBLE_TAP_MS = 320
const DOUBLE_TAP_SLOP = 36

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

export default function LetterReader() {
  const open = useNavigationStore((s) => s.letterOpen)
  const activeId = useNavigationStore((s) => s.activeId)
  const close = useNavigationStore((s) => s.closeLetter)

  const project = activeId ? getProjectById(activeId) : null
  const letter = project?.letter

  if (!open || !letter) return null

  // Mounted fresh on every open, so each reading starts fitted and at the top
  // of the page rather than wherever the last one was left.
  return <Reader letter={letter} accent={project.color} onClose={close} />
}

function Reader({ letter, accent, onClose }) {
  const reducedMotion = useReducedMotion()

  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const pageRef = useRef(null)
  const fullRef = useRef(null)

  const zoomRef = useRef(1)
  const geomRef = useRef({ w: 1, h: 1, left: 0, top: 0 })
  const tweenRef = useRef(0)
  const flingRef = useRef(0)
  const restoreFocusRef = useRef(null)

  const [zoom, setZoom] = useState(1)
  const [loaded, setLoaded] = useState(false)

  const ratio = letter.height / letter.width

  // --- Layout --------------------------------------------------------------
  // Size the page for a zoom level and centre it in the scroll area, returning
  // where it ended up. Everything else is built on this one function.
  const layout = useCallback(
    (z) => {
      const stage = stageRef.current
      const canvas = canvasRef.current
      const page = pageRef.current
      if (!stage || !canvas || !page) return geomRef.current

      const sw = stage.clientWidth
      const sh = stage.clientHeight
      const pad = sw < 640 ? 12 : 32
      const fit = Math.max(160, Math.min(sw - pad * 2, MAX_FIT))

      const w = Math.round(fit * z)
      const h = Math.round(w * ratio)
      // The scroll area is never smaller than the viewport, so a page narrower
      // than the screen sits centred in it instead of pinned to the left.
      const cw = Math.max(sw, w + pad * 2)
      const ch = Math.max(sh, h + pad * 2)
      const left = Math.round((cw - w) / 2)
      const top = Math.round((ch - h) / 2)

      canvas.style.width = `${cw}px`
      canvas.style.height = `${ch}px`
      page.style.width = `${w}px`
      page.style.height = `${h}px`
      page.style.left = `${left}px`
      page.style.top = `${top}px`

      geomRef.current = { w, h, left, top }
      return geomRef.current
    },
    [ratio]
  )

  // Change the zoom while keeping the point at (clientX, clientY) under the
  // same spot on the page. The page point is found in page-relative fractions
  // BEFORE the resize, and the scroll is set so that fraction is back under the
  // pointer AFTER it.
  const zoomAt = useCallback(
    (next, clientX, clientY) => {
      const stage = stageRef.current
      if (!stage) return
      const z = clamp(next, MIN_ZOOM, MAX_ZOOM)
      const rect = stage.getBoundingClientRect()
      const px = clientX - rect.left
      const py = clientY - rect.top

      const g0 = geomRef.current
      const u = (stage.scrollLeft + px - g0.left) / g0.w
      const v = (stage.scrollTop + py - g0.top) / g0.h

      const g1 = layout(z)
      stage.scrollLeft = u * g1.w + g1.left - px
      stage.scrollTop = v * g1.h + g1.top - py

      zoomRef.current = z
      setZoom(z)
    },
    [layout]
  )

  const stopMotion = useCallback(() => {
    cancelAnimationFrame(tweenRef.current)
    cancelAnimationFrame(flingRef.current)
  }, [])

  // Eased zoom for the discrete gestures — buttons, keys, double-tap. Each
  // frame re-anchors on the same point, so the ease never drifts off it.
  const animateZoomTo = useCallback(
    (target, clientX, clientY) => {
      stopMotion()
      const from = zoomRef.current
      const to = clamp(target, MIN_ZOOM, MAX_ZOOM)
      if (reducedMotion || Math.abs(to - from) < 0.001) {
        zoomAt(to, clientX, clientY)
        return
      }
      const start = performance.now()
      const DURATION = 240
      const tick = (now) => {
        const t = Math.min(1, (now - start) / DURATION)
        zoomAt(from + (to - from) * easeOutCubic(t), clientX, clientY)
        if (t < 1) tweenRef.current = requestAnimationFrame(tick)
      }
      tweenRef.current = requestAnimationFrame(tick)
    },
    [reducedMotion, zoomAt, stopMotion]
  )

  // Button and keyboard zoom anchor on the centre of what is currently visible.
  const zoomAroundCentre = useCallback(
    (target) => {
      const r = stageRef.current?.getBoundingClientRect()
      if (!r) return
      animateZoomTo(target, r.left + r.width / 2, r.top + r.height / 2)
    },
    [animateZoomTo]
  )

  const zoomIn = () => zoomAroundCentre(zoomRef.current * STEP)
  const zoomOut = () => {
    const next = zoomRef.current / STEP
    // Snap the last step home, so "out" always arrives exactly at fit.
    zoomAroundCentre(next < 1.06 ? 1 : next)
  }
  const fit = () => zoomAroundCentre(1)

  // --- First layout, and every resize after it -----------------------------
  useLayoutEffect(() => {
    layout(1)
    const stage = stageRef.current
    if (!stage || typeof ResizeObserver === 'undefined') return

    // On a resize or a phone rotation, keep the zoom and keep the middle of the
    // view on the same part of the page.
    const ro = new ResizeObserver(() => {
      const g0 = geomRef.current
      const cx = stage.clientWidth / 2
      const cy = stage.clientHeight / 2
      const u = (stage.scrollLeft + cx - g0.left) / g0.w
      const v = (stage.scrollTop + cy - g0.top) / g0.h
      const g1 = layout(zoomRef.current)
      stage.scrollLeft = u * g1.w + g1.left - stage.clientWidth / 2
      stage.scrollTop = v * g1.h + g1.top - stage.clientHeight / 2
    })
    ro.observe(stage)
    return () => ro.disconnect()
  }, [layout])

  // A cached image can finish before React attaches onLoad; check once.
  useEffect(() => {
    if (fullRef.current?.complete && fullRef.current.naturalWidth > 0) setLoaded(true)
  }, [])

  // --- Focus -----------------------------------------------------------------
  // Into the page on open, so the arrow keys and Page Down read it immediately;
  // back to the card on close, so the keyboard lands where it left.
  useEffect(() => {
    restoreFocusRef.current = document.activeElement
    stageRef.current?.focus({ preventScroll: true })
    return () => {
      const el = restoreFocusRef.current
      if (el && typeof el.focus === 'function') el.focus({ preventScroll: true })
    }
  }, [])

  // --- Keyboard --------------------------------------------------------------
  // Capture phase, and Escape is stopped here: this overlay is the topmost
  // thing on screen and gets first refusal, so Escape closes the letter and not
  // the panel underneath it. MissionPanel also checks `letterOpen`, so the
  // precedence is stated in both places rather than implied by listener order.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      // Leave the browser's own page zoom (ctrl/⌘ + / −) alone.
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        zoomAroundCentre(zoomRef.current * STEP)
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        const next = zoomRef.current / STEP
        zoomAroundCentre(next < 1.06 ? 1 : next)
      } else if (e.key === '0') {
        e.preventDefault()
        zoomAroundCentre(1)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose, zoomAroundCentre])

  // --- Wheel -----------------------------------------------------------------
  // A plain wheel scrolls, natively. With ctrl or ⌘ held — which is also what a
  // laptop trackpad pinch sends — it zooms at the pointer. Registered by hand
  // because React's wheel listener is passive and cannot preventDefault, and
  // without that the browser would zoom the entire site instead.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      stopMotion()
      // Line-mode wheels (Firefox) report in lines, not pixels.
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      zoomAt(zoomRef.current * Math.exp(-dy * 0.0025), e.clientX, e.clientY)
    }
    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [zoomAt, stopMotion])

  // --- Pointers: pan, pinch, double-tap --------------------------------------
  // The stage takes `touch-action: none`, so every touch comes here rather than
  // to the browser — otherwise a pinch would zoom the whole site, not the page.
  // That means one-finger scrolling is ours to do as well, which is why the
  // pan below carries a little momentum when the finger leaves.
  const gesture = useRef({
    pointers: new Map(),
    pan: null,
    pinch: null,
    lastTap: null,
    velocity: { x: 0, y: 0, t: 0 },
  })

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const g = gesture.current
    const stage = stageRef.current
    stopMotion()
    stage.setPointerCapture?.(e.pointerId)
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, t0: performance.now(), x0: e.clientX, y0: e.clientY })

    if (g.pointers.size === 1) {
      g.pan = { x: e.clientX, y: e.clientY }
      g.velocity = { x: 0, y: 0, t: performance.now() }
      g.pinch = null
    } else if (g.pointers.size === 2) {
      const [a, b] = [...g.pointers.values()]
      g.pinch = {
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        zoom: zoomRef.current,
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      }
      g.pan = null
      // Two fingers is never a tap.
      g.lastTap = null
    }
  }

  const onPointerMove = (e) => {
    const g = gesture.current
    const p = g.pointers.get(e.pointerId)
    if (!p) return
    p.x = e.clientX
    p.y = e.clientY
    const stage = stageRef.current

    if (g.pinch && g.pointers.size >= 2) {
      const [a, b] = [...g.pointers.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      // Fingers moving together pan; fingers moving apart zoom. Pan first,
      // then zoom around where the fingers now are.
      stage.scrollLeft -= mid.x - g.pinch.mid.x
      stage.scrollTop -= mid.y - g.pinch.mid.y
      g.pinch.mid = mid
      zoomAt(g.pinch.zoom * (dist / g.pinch.dist), mid.x, mid.y)
      return
    }

    if (g.pan) {
      const dx = e.clientX - g.pan.x
      const dy = e.clientY - g.pan.y
      stage.scrollLeft -= dx
      stage.scrollTop -= dy
      g.pan = { x: e.clientX, y: e.clientY }

      // A smoothed velocity, for the fling when the finger lifts.
      const now = performance.now()
      const dt = Math.max(1, now - g.velocity.t)
      g.velocity = {
        x: 0.75 * (dx / dt) + 0.25 * g.velocity.x,
        y: 0.75 * (dy / dt) + 0.25 * g.velocity.y,
        t: now,
      }
    }
  }

  const onPointerUp = (e) => {
    const g = gesture.current
    const p = g.pointers.get(e.pointerId)
    if (!p) return
    g.pointers.delete(e.pointerId)
    const now = performance.now()

    // Dropping from two fingers to one: carry on panning with the finger that
    // stayed, from where it is now, so the page does not jump.
    if (g.pointers.size === 1) {
      const [rest] = [...g.pointers.values()]
      g.pinch = null
      g.pan = { x: rest.x, y: rest.y }
      g.velocity = { x: 0, y: 0, t: now }
      return
    }
    if (g.pointers.size > 0 || e.type === 'pointercancel') {
      if (g.pointers.size === 0) g.pan = g.pinch = null
      return
    }

    const wasPinch = !!g.pinch
    g.pan = null
    g.pinch = null
    if (wasPinch) return

    // --- tap / double-tap ---
    const still = Math.hypot(e.clientX - p.x0, e.clientY - p.y0) < TAP_SLOP
    const quick = now - p.t0 < TAP_MS
    if (still && quick) {
      const prev = g.lastTap
      if (
        prev &&
        now - prev.t < DOUBLE_TAP_MS &&
        Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < DOUBLE_TAP_SLOP
      ) {
        g.lastTap = null
        const narrow = (stageRef.current?.clientWidth ?? 0) < 640
        const target =
          zoomRef.current > 1.05 ? 1 : narrow ? DOUBLE_TAP_ZOOM_NARROW : DOUBLE_TAP_ZOOM_WIDE
        animateZoomTo(target, e.clientX, e.clientY)
      } else {
        g.lastTap = { t: now, x: e.clientX, y: e.clientY }
      }
      return
    }

    // --- fling --- touch and pen only; a mouse drag stopping dead is correct.
    if (e.pointerType === 'mouse' || reducedMotion) return
    let { x: vx, y: vy } = g.velocity
    if (now - g.velocity.t > 60 || Math.hypot(vx, vy) < 0.05) return
    let last = now
    const stage = stageRef.current
    const step = (t) => {
      const dt = Math.min(40, t - last)
      last = t
      stage.scrollLeft -= vx * dt
      stage.scrollTop -= vy * dt
      const decay = Math.pow(0.94, dt / 16)
      vx *= decay
      vy *= decay
      if (Math.hypot(vx, vy) > 0.02) flingRef.current = requestAnimationFrame(step)
    }
    flingRef.current = requestAnimationFrame(step)
  }

  useEffect(() => () => stopMotion(), [stopMotion])

  const percent = Math.round(zoom * 100)

  return (
    <div
      className="reader"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-title"
      style={accent ? { '--accent': accent } : undefined}
    >
      <header className="reader__head">
        <div className="reader__id">
          <span className="reader__eyebrow mono">{letter.label}</span>
          <h2 className="reader__title" id="reader-title">
            {letter.author}
          </h2>
          <p className="reader__role">
            {letter.role} · {letter.org}
          </p>
        </div>

        <button type="button" className="reader__close" onClick={onClose} aria-label="Close the letter">
          <span aria-hidden="true">✕</span>
          <span className="reader__esc mono">Esc</span>
        </button>
      </header>

      <div
        ref={stageRef}
        className="reader__stage"
        tabIndex={0}
        aria-label="Letter page. Scroll to read. Plus and minus zoom, zero fits the page."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div ref={canvasRef} className="reader__canvas">
          <div ref={pageRef} className={`reader__page${loaded ? ' is-loaded' : ''}`}>
            {/* The panel's preview, already in the cache, holds the page while
                the full-resolution image arrives — so the reader opens on a
                page, never on an empty rectangle. */}
            <img
              className="reader__img reader__img--preview"
              src={`${BASE}${letter.preview}`}
              alt=""
              draggable={false}
            />
            <img
              ref={fullRef}
              className="reader__img reader__img--full"
              src={`${BASE}${letter.full}`}
              alt={`${letter.label} from ${letter.author}, ${letter.role} at ${letter.org}. The full text follows.`}
              draggable={false}
              decoding="async"
              fetchPriority="high"
              onLoad={() => setLoaded(true)}
            />
          </div>
        </div>
      </div>

      <div className="reader__tools" role="toolbar" aria-label="Zoom">
        <button type="button" onClick={zoomOut} disabled={zoom <= MIN_ZOOM + 0.001} aria-label="Zoom out">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <output className="reader__zoom mono" aria-live="polite">
          {percent}%
        </output>
        <button type="button" onClick={zoomIn} disabled={zoom >= MAX_ZOOM - 0.001} aria-label="Zoom in">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <span className="reader__sep" aria-hidden="true" />
        <button type="button" className="reader__fit" onClick={fit} disabled={zoom <= MIN_ZOOM + 0.001}>
          Fit
        </button>
      </div>

      {/* What a screen reader reads in place of the image. Visually hidden, not
          display:none — that would hide it from assistive technology too. */}
      <div className="reader__transcript">
        <h3>Full text of the letter</h3>
        {letter.transcript.map((para) => (
          <p key={para.slice(0, 32)}>{para}</p>
        ))}
      </div>
    </div>
  )
}
