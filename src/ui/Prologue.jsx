import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { chapters } from '../data/prologue'
import { approach, smoothstep, WARP_START } from '../scene/approach'
import { useNavigationStore } from '../state/navigationStore'
import { useReducedMotion } from '../scene/useReducedMotion'

// -----------------------------------------------------------------------------
// The approach sequence — a scroll-driven narrative that ends by delivering the
// visitor into the orbital system through the wormhole.
//
// THE ONE RULE: this is scroll-DRIVEN, never scroll-JACKED.
//
// The page scrolls natively. No wheel events are intercepted, no scroll
// distance is remapped, nothing snaps. The scrollbar tells the truth about
// position and length, Page Down / Home / End / spacebar all behave normally,
// and a screen reader walks real headings and paragraphs in order. Scroll
// position is READ and used to drive the camera; it is never taken over.
//
// This matters more than it sounds. Nielsen Norman Group's scrolljacking
// research found most participants were at least mildly disoriented by hijacked
// scrolling, and several read it as the page being broken — the exact opposite
// of the confidence a portfolio needs to produce in its first ten seconds. The
// visual payoff here does not require the hijack, so we do not take it.
//
// The sequence is also never a gate. `Skip` is present from the first frame and
// stays reachable, because a recruiter with sixty seconds must be able to get
// to the projects immediately. An intro that cannot be escaped is the single
// most common way a portfolio like this loses the person it was built for.
// -----------------------------------------------------------------------------

export default function Prologue() {
  const stage = useNavigationStore((s) => s.stage)
  const enterSystem = useNavigationStore((s) => s.enterSystem)
  const reducedMotion = useReducedMotion()

  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const sectionRefs = useRef([])
  const tickingRef = useRef(false)

  const isPrologue = stage === 'prologue'

  // Don't let the browser restore a previous scroll offset on reload — that
  // would drop the visitor into the middle of the flight with no context.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  }, [])

  // Scroll is the only input. Read it, publish it to the 3D layer, and commit
  // to the system once the visitor reaches the end.
  useEffect(() => {
    if (!isPrologue) return

    const read = () => {
      tickingRef.current = false
      const max = document.documentElement.scrollHeight - window.innerHeight

      // A non-scrollable page means the layout has not settled yet — it does
      // NOT mean the visitor has reached the end.
      //
      // This distinction is why "Replay the approach" appeared to do nothing.
      // Returning to the prologue re-rendered the chapters, but on that first
      // pass the body still carried `is-system` (overflow: hidden, #root pinned
      // to 100dvh), so the document measured exactly one viewport tall and
      // `max` came out 0. Treating that as progress = 1 tripped the arrival
      // threshold on the very first read and threw the visitor straight back
      // into the system, within a frame. Treat it as 0 and commit to nothing.
      if (max <= 0) {
        approach.progress = 0
        approach.warp = 0
        setProgress(0)
        return
      }

      const p = Math.min(1, Math.max(0, window.scrollY / max))

      approach.progress = p
      approach.warp = smoothstep(WARP_START, 1, p)
      setProgress(p)

      // Arrival. The wormhole is fully ramped by this point, so committing here
      // reads as coming out the far side of it rather than as a cut.
      if (p >= 0.995) enterSystem()
    }

    // rAF-throttled: scroll can fire faster than the display refreshes, and the
    // camera only needs one value per frame.
    const onScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true
      requestAnimationFrame(read)
    }

    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [isPrologue, enterSystem])

  // Reveal each chapter as it arrives, and track which one holds the middle of
  // the screen for the progress rail. IntersectionObserver rather than scroll
  // maths: it is the browser's own job, runs off the main thread, and stays
  // correct if a chapter's height changes with its content.
  useEffect(() => {
    if (!isPrologue) return
    const nodes = sectionRefs.current.filter(Boolean)
    if (!nodes.length) return

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const i = Number(e.target.dataset.index)
          e.target.classList.toggle('is-visible', e.isIntersecting)
          if (e.isIntersecting) setActive(i)
        })
      },
      // Only the chapter crossing the vertical middle counts as active, so the
      // rail never shows two at once during a transition.
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    )

    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [isPrologue])

  // Once arrived, the page must not scroll — the system is a fixed viewport
  // experience and a stray scroll would reveal blank space beneath it.
  //
  // useLayoutEffect, not useEffect, and deliberately so: every layout effect
  // runs before any passive effect, which guarantees the document is scrollable
  // again BEFORE the scroll listener above takes its first measurement. With a
  // passive effect the order reverses and the first read measures a page that
  // is still locked. Restoring scroll position belongs in the same pass, so the
  // reset is applied before the browser paints rather than as a visible jump.
  useLayoutEffect(() => {
    document.body.classList.toggle('is-system', !isPrologue)
    // Restarting has to reset scroll, or the visitor lands at the very bottom —
    // which is the arrival threshold, and is immediately thrown back in.
    if (isPrologue) window.scrollTo(0, 0)
    return () => document.body.classList.remove('is-system')
  }, [isPrologue])

  if (!isPrologue) return null

  const jumpTo = (i) => {
    sectionRefs.current[i]?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <>
      {/* Always available, from the first frame. Not a hidden escape hatch. */}
      <button type="button" className="prologue__skip" onClick={enterSystem}>
        <span>Skip to the projects</span>
        <span className="prologue__skip-arrow" aria-hidden="true">→</span>
      </button>

      {/* Chapter rail. Doubles as a table of contents — a visitor can see how
          long this is before committing to it, and jump straight to a beat. */}
      <nav className="prologue__rail" aria-label="Approach sequence">
        {/* transform, not the `scale` property: CSS has `scale` but no
            `scaleY`, so React would emit an invalid declaration. */}
        <span
          className="prologue__rail-fill"
          style={{ transform: `scaleY(${progress})` }}
          aria-hidden="true"
        />
        <ul>
          {chapters.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className={`prologue__dot ${i === active ? 'is-active' : ''}`}
                onClick={() => jumpTo(i)}
                aria-current={i === active ? 'step' : undefined}
              >
                <span className="prologue__dot-mark" aria-hidden="true" />
                <span className="prologue__dot-label">{c.kicker}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main className="prologue">
        {chapters.map((c, i) => (
          <section
            key={c.id}
            data-index={i}
            ref={(el) => (sectionRefs.current[i] = el)}
            className={`prologue__chapter ${c.isArrival ? 'is-arrival' : ''}`}
            aria-labelledby={`chapter-${c.id}`}
          >
            <div className="prologue__card">
              <p className="prologue__kicker mono">
                <span className="prologue__code">{c.code}</span>
                {c.kicker}
              </p>

              <h2 id={`chapter-${c.id}`} className="prologue__title">
                {c.title}
              </h2>

              {c.lead && <p className="prologue__lead">{c.lead}</p>}
              {c.body && <p className="prologue__body prose">{c.body}</p>}

              {c.stats && (
                <ul className="prologue__stats">
                  {c.stats.map((s) => (
                    <li key={s.label}>
                      <span className="prologue__stat-value">{s.value}</span>
                      <span className="prologue__stat-label mono">{s.label}</span>
                      <span className="prologue__stat-note">{s.note}</span>
                    </li>
                  ))}
                </ul>
              )}

              {c.tags && (
                <ul className="prologue__tags">
                  {c.tags.map((t) => (
                    <li key={t} className="mono">{t}</li>
                  ))}
                </ul>
              )}

              {c.meta && <p className="prologue__meta mono">{c.meta}</p>}

              {/* The arrival chapter carries an explicit control as well as the
                  scroll threshold, so entering never depends on landing a
                  precise scroll position — and so there is a real focusable
                  button for anyone navigating by keyboard. */}
              {c.isArrival && (
                <button
                  type="button"
                  className="prologue__enter"
                  onClick={enterSystem}
                >
                  Enter the system
                  <span aria-hidden="true">→</span>
                </button>
              )}
            </div>

            {i === 0 && (
              <p className="prologue__cue mono" aria-hidden="true">
                <span className="prologue__cue-line" />
                Scroll to begin the approach
              </p>
            )}
          </section>
        ))}

        {/* Scroll runway.
            Without it the arrival chapter is on screen at exactly the moment
            the scroll threshold commits to the system — so the visitor is
            pulled through the wormhole before they have read the one beat that
            explains what they are about to be handed. This gives the last
            chapter room to be read, and turns the final stretch of scroll into
            pure wormhole with no text competing for attention. */}
        <div className="prologue__runway" aria-hidden="true" />
      </main>
    </>
  )
}
