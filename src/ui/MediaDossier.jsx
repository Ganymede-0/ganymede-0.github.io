import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigationStore } from '../state/navigationStore'
import { getMediaForProject } from '../data/rahaMedia'
import { getProjectById } from '../data/projects'
import { useReducedMotion } from '../scene/useReducedMotion'

// -----------------------------------------------------------------------------
// The walkthrough overlay — the product's own screens, full bleed, over the
// system.
//
// Why an overlay rather than a route or a page: the visitor is parked at a
// planet with the camera framed on it and a mission panel open. Navigating away
// would throw all of that away and cost a return flight to get back. The dossier
// covers the view, and closing it drops the visitor exactly where they were.
//
// The reel is flat (see rahaMedia.js) so the arrow keys run the whole set in
// order and the chapter rail is a jump control layered on top, rather than the
// primary structure. That ordering is what turns 62 screenshots into a session.
// -----------------------------------------------------------------------------

// How many frames either side of the current one get warmed. One is enough to
// make a held arrow key feel instant without speculatively pulling the entire
// 2.9 MB set for someone who opens the dossier and immediately closes it.
const PRELOAD_RADIUS = 1

export default function MediaDossier() {
  const open = useNavigationStore((s) => s.dossierOpen)
  const index = useNavigationStore((s) => s.dossierIndex)
  const setIndex = useNavigationStore((s) => s.setDossierIndex)
  const close = useNavigationStore((s) => s.closeDossier)
  const activeId = useNavigationStore((s) => s.activeId)
  const reducedMotion = useReducedMotion()

  const shellRef = useRef(null)
  const stripRef = useRef(null)
  // The element that had focus before the dossier opened, so closing returns
  // the keyboard where it was instead of dumping it at the top of the document.
  const restoreFocusRef = useRef(null)

  const media = getMediaForProject(activeId)
  const reel = useMemo(() => media?.reel ?? [], [media])
  const current = reel[index] ?? reel[0]
  const chapter = media?.rail.find((c) => c.id === current?.chapterId)

  // Thumbnails show the CURRENT chapter only. A single strip of all 62 would be
  // a scrub bar with no landmarks; the rail above handles crossing chapters.
  const chapterShots = useMemo(
    () => reel.map((item, i) => ({ item, i })).filter(({ item }) => item.chapterId === current?.chapterId),
    [reel, current]
  )

  const go = useCallback(
    (next) => {
      if (reel.length === 0) return
      // Clamped, not wrapped. Running off the end of a narrative sequence and
      // landing back at the beginning reads as a glitch, not as a loop.
      setIndex(Math.max(0, Math.min(reel.length - 1, next)))
    },
    [reel.length, setIndex]
  )

  // --- Keyboard ------------------------------------------------------------
  // Captured on the document while open, and Escape is stopped here so it does
  // not also reach MissionPanel's handler and close the panel underneath.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      switch (e.key) {
        case 'Escape':
          e.stopPropagation()
          close()
          break
        case 'ArrowRight':

          go(index + 1)
          break
        case 'ArrowLeft':
          go(index - 1)
          break
        case 'Home':
          e.preventDefault()
          go(0)
          break
        case 'End':
          e.preventDefault()
          go(reel.length - 1)
          break
        default:
          return
      }
    }
    // Capture phase: this overlay is the topmost thing on screen, so it gets
    // first refusal on the keys it owns.
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, index, go, close, reel.length])

  // --- Focus ---------------------------------------------------------------
  useEffect(() => {
    if (!open) return
    restoreFocusRef.current = document.activeElement
    shellRef.current?.focus()
    return () => {
      const el = restoreFocusRef.current
      if (el && typeof el.focus === 'function') el.focus()
    }
  }, [open])

  // --- Neighbour warming ---------------------------------------------------
  useEffect(() => {
    if (!open) return
    for (let offset = -PRELOAD_RADIUS; offset <= PRELOAD_RADIUS; offset += 1) {
      const neighbour = reel[index + offset]
      if (neighbour?.type === 'image') {
        const img = new Image()
        img.src = neighbour.full
      }
    }
  }, [open, index, reel])

  // Keep the active thumbnail in view when the arrow keys move past the edge of
  // the strip — otherwise the selection silently leaves the visible window.
  useEffect(() => {
    if (!open) return
    const strip = stripRef.current
    const active = strip?.querySelector('[data-active="true"]')
    active?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [open, index, reducedMotion])

  if (!open || !media || !current) return null

  const imageIndex = reel.slice(0, index + 1).filter((i) => i.type === 'image').length

  // The walkthrough wears the accent of the body it was opened from, so the
  // overlay reads as belonging to that planet rather than as a generic viewer.
  const accent = getProjectById(activeId)?.color

  return (
    <div
      className="dossier"
      role="dialog"
      aria-modal="true"
      aria-label={`${getProjectById(activeId)?.name ?? 'Project'} platform walkthrough`}
      style={accent ? { '--accent': accent } : undefined}
    >
      {/* Opaque scrim. The 3D scene behind is bright and busy; screenshots of a
          white-background medical UI need a dead-flat ground to read against. */}
      <button
        type="button"
        className="dossier__scrim"
        aria-label="Close walkthrough"
        onClick={close}
        tabIndex={-1}
      />

      <div className="dossier__shell" ref={shellRef} tabIndex={-1}>
        <header className="dossier__head">
          <div className="dossier__id">
            <span className="dossier__eyebrow mono">Raha · Platform walkthrough</span>
            <h2 className="dossier__title">{chapter?.title ?? 'Walkthrough'}</h2>
            {/* Chapter context belongs beside the chapter's name, not in a row
                of its own under the stage — down there it stole height from the
                screenshot, which is the one thing the viewer came to see. */}
            {chapter?.blurb && <p className="dossier__blurb">{chapter.blurb}</p>}
          </div>

          <div className="dossier__meta">
            <span className="dossier__counter mono" aria-live="polite">
              {current.type === 'video' ? 'Film' : `${imageIndex} / ${media.shotCount}`}
            </span>
            <button type="button" className="dossier__close" onClick={close} aria-label="Close walkthrough">
              <span aria-hidden="true">✕</span>
              <span className="dossier__esc mono">Esc</span>
            </button>
          </div>
        </header>

        {/* Chapter rail. Horizontally scrollable rather than wrapping, so the
            journey stays a single line you move along. */}
        <nav className="dossier__rail" aria-label="Chapters">
          <ul>
            {media.rail.map((c) => {
              const first = reel.findIndex((item) => item.chapterId === c.id)
              const isCurrent = c.id === current.chapterId
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className="dossier__chapter"
                    aria-current={isCurrent ? 'true' : undefined}
                    onClick={() => go(first)}
                  >
                    <span className="dossier__chapter-index mono">{c.index}</span>
                    <span className="dossier__chapter-title">{c.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="dossier__stage">
          <button
            type="button"
            className="dossier__arrow dossier__arrow--prev"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Previous"
          >
            <span aria-hidden="true">‹</span>
          </button>

          <figure className="dossier__frame">
            {current.type === 'video' ? (
              <video
                className="dossier__media dossier__media--video"
                src={current.src}
                poster={current.poster}
                controls
                // `none`, not `metadata`: the recording is 13 MB and nothing
                // should leave the network until the visitor presses play.
                preload="none"
                playsInline
              />
            ) : (
              <img
                className="dossier__media"
                // Keying on the slug remounts the element between shots, which
                // is what lets the fade-in run again instead of the browser
                // swapping the pixels underneath a already-settled node.
                key={current.id}
                src={current.full}
                alt={current.caption}
                fetchPriority="high"
                decoding="async"
              />
            )}

            <figcaption className="dossier__caption">
              <span className="dossier__caption-chapter mono">{current.chapterTitle}</span>
              <p>{current.caption}</p>
            </figcaption>
          </figure>

          <button
            type="button"
            className="dossier__arrow dossier__arrow--next"
            onClick={() => go(index + 1)}
            disabled={index === reel.length - 1}
            aria-label="Next"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <div className="dossier__strip" ref={stripRef}>
          {chapterShots.map(({ item, i }) => (
            <button
              type="button"
              key={item.id}
              className="dossier__thumb"
              data-active={i === index}
              aria-label={item.caption}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => go(i)}
            >
              {item.type === 'video' ? (
                <>
                  <img src={item.poster} alt="" loading="lazy" decoding="async" />
                  <span className="dossier__thumb-play" aria-hidden="true">▶</span>
                </>
              ) : (
                <img src={item.thumb} alt="" loading="lazy" decoding="async" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
