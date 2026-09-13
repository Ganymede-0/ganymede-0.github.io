import { useEffect, useMemo, useRef, useState } from 'react'
import { identity, cvSections } from '../data/cv'
import { projects } from '../data/projects'
import { useNavigationStore } from '../state/navigationStore'
import { useReducedMotion } from '../scene/useReducedMotion'
import SocialLinks from './SocialLinks'

// -----------------------------------------------------------------------------
// THE DOSSIER — the CV, as a destination.
//
// WHAT CHANGED AND WHY
// The previous version was a drawer: a 41rem column pinned to the left edge with
// the scene showing past it. That shape had two problems. It framed the single
// most important document on the site as an accessory to the 3D — something
// pulled out over the top of the real page — and it forced a 62-character
// measure on content that includes four-column stacks and metric grids, so the
// technical stack wrapped into a ribbon and the timeline had no room to breathe.
//
// This is a full-width reading environment instead: an index rail that tracks
// where the reader is, a headline band of the numbers a technical reviewer scans
// for first, and sections given the width they actually need. The scene stays
// behind it, dimmed, because arriving here through a star should still feel like
// somewhere — but nothing about the layout is negotiating with it any more.
//
// ONE VIEW, NOT TWO
// It renders identically whether it was reached by warping through the star or
// by clicking the HUD index. A destination that changes shape depending on the
// door you came through is two things to learn instead of one.
// -----------------------------------------------------------------------------

/** The four numbers a technical reviewer scans for, lifted from the project
 *  data so they cannot drift out of step with the case studies below. */
function headlineStats() {
  const pick = (id, label) => {
    const p = projects.find((x) => x.id === id)
    const m = p?.metrics?.find((x) => x.label === label)
    return m ? { ...m, from: p.name, accent: p.color } : null
  }
  return [
    pick('raha', 'Dice score'),
    pick('bayan', 'RUL error (MAE, cycles)'),
    pick('sharqiyah', 'Model R²'),
    pick('raha', 'Volumetric data processed'),
  ].filter(Boolean)
}

function OrbitGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <ellipse
        cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-18 12 12)"
        fill="none" stroke="currentColor" strokeWidth="1.4"
      />
      <circle cx="12" cy="12" r="3.1" fill="currentColor" />
    </svg>
  )
}

function Timeline({ items, onOpen }) {
  return (
    <ol className="dsr-timeline">
      {items.map((it, i) => (
        <li className="dsr-entry" key={i}>
          <div className="dsr-entry__head">
            <h4>{it.role}</h4>
            <span className="dsr-entry__period mono">{it.period}</span>
          </div>
          <p className="dsr-entry__org">{it.org}</p>
          <ul className="dsr-points">
            {it.points.map((p, j) => (
              <li key={j}>{p}</li>
            ))}
          </ul>
          {it.projectId && (
            <button
              type="button"
              className="dsr-orbit-link dsr-orbit-link--quiet"
              onClick={() => onOpen(it.projectId)}
            >
              Open in orbit <span aria-hidden="true">↗</span>
            </button>
          )}
        </li>
      ))}
    </ol>
  )
}

function Systems({ items, onOpen }) {
  return (
    <div className="dsr-systems">
      {items.map((it, i) => {
        const project = projects.find((p) => p.id === it.projectId)
        return (
          <article
            className="dsr-system"
            key={i}
            style={project ? { '--accent': project.color } : undefined}
          >
            <div className="dsr-system__head">
              <h4>{it.name}</h4>
              <span className="dsr-entry__period mono">{it.period}</span>
            </div>
            {it.badge && <p className="dsr-system__badge">{it.badge}</p>}
            <p className="dsr-system__blurb">{it.blurb}</p>

            {project?.metrics?.length ? (
              <dl className="dsr-metrics">
                {project.metrics.slice(0, 3).map((m) => (
                  <div key={m.label}>
                    <dt className="mono">{m.value}</dt>
                    <dd>{m.label}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <ul className="dsr-chips">
              {it.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>

            {it.projectId && (
              <button type="button" className="dsr-orbit-link" onClick={() => onOpen(it.projectId)}>
                View in orbit <span aria-hidden="true">↗</span>
              </button>
            )}
          </article>
        )
      })}
    </div>
  )
}

function SectionBody({ section, onOpen }) {
  switch (section.kind) {
    case 'prose':
      return <p className="dsr-prose">{section.body}</p>
    case 'timeline':
      return <Timeline items={section.items} onOpen={onOpen} />
    case 'projects':
      return <Systems items={section.items} onOpen={onOpen} />
    case 'stack':
      return (
        <div className="dsr-stack">
          {section.groups.map((g) => (
            <div className="dsr-stack__group" key={g.label}>
              <p className="dsr-stack__label mono">{g.label}</p>
              <ul className="dsr-chips">
                {g.items.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )
    case 'list':
      return (
        <ul className="dsr-awards">
          {section.items.map((it, i) => (
            <li key={i}>
              <p className="dsr-award__title">{it.title}</p>
              <p className="dsr-award__detail">{it.detail}</p>
            </li>
          ))}
        </ul>
      )
    default:
      return null
  }
}

export default function CvDossier() {
  const cvOpen = useNavigationStore((s) => s.cvOpen)
  const cvSection = useNavigationStore((s) => s.cvSection)
  const setCvSection = useNavigationStore((s) => s.setCvSection)
  const closeCv = useNavigationStore((s) => s.closeCv)
  const returnToOrbit = useNavigationStore((s) => s.returnToOrbit)
  const focusBody = useNavigationStore((s) => s.focusBody)
  const reducedMotion = useReducedMotion()

  const rootRef = useRef()
  const scrollRef = useRef()
  const sectionRefs = useRef({})

  // Where the reader actually is, kept separate from cvSection (which is
  // navigation INTENT). If scrolling wrote back into the same value, every
  // scroll would retrigger the scroll-to effect and the page would fight the
  // reader for control of its own scroll position.
  const [visibleId, setVisibleId] = useState(null)

  const stats = useMemo(() => headlineStats(), [])

  // The entrance is a CSS animation, not a JS tween, and that is a deliberate
  // choice rather than a stylistic one. This page sits on top of a WebGL scene
  // that can saturate the main thread; a JavaScript tween shares that thread and
  // GSAP's lag smoothing then stretches a 0.7s fade into several seconds of a
  // blank-looking document. Measured here: under a software renderer the panel
  // was still at opacity ~0 two and a half seconds after opening. A CSS
  // animation is handed to the compositor and runs at full speed no matter what
  // the main thread is doing, so the CV is readable on time on any machine.
  // See [data-rise] in dossier-cv.css.

  // Jump to the requested section on open, or when the rail is used.
  //
  // The first section is a special case: scrolling it to the top of the viewport
  // would push the masthead off screen, so asking for "Profile" would hide the
  // name, the headline and the headline metrics — the three things a reviewer
  // most wants in the first second. Requesting the opening section means "the
  // top of the document", so that is where it goes.
  useEffect(() => {
    if (!cvOpen || !cvSection) return
    const behavior = reducedMotion ? 'auto' : 'smooth'
    if (cvSection === cvSections[0].id) {
      scrollRef.current?.scrollTo({ top: 0, behavior })
      return
    }
    sectionRefs.current[cvSection]?.scrollIntoView({ behavior, block: 'start' })
  }, [cvOpen, cvSection, reducedMotion])

  // Track the reader for the rail. The band is the top slice of the viewport, so
  // a section becomes current as its heading reaches reading position rather
  // than when its last line finally scrolls away.
  useEffect(() => {
    if (!cvOpen) return
    const root = scrollRef.current
    const nodes = Object.values(sectionRefs.current).filter(Boolean)
    if (!root || !nodes.length) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setVisibleId(e.target.dataset.cvId)
        })
      },
      { root, rootMargin: '0px 0px -82% 0px', threshold: 0 }
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [cvOpen])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && cvOpen) closeCv()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cvOpen, closeCv])

  if (!cvOpen) return null

  const current = visibleId ?? cvSection ?? cvSections[0].id
  const activeIndex = Math.max(0, cvSections.findIndex((s) => s.id === current))

  return (
    <section className="dsr" ref={rootRef} aria-label={`${identity.name} — curriculum vitae`}>
      <div className="dsr__veil" aria-hidden="true" />

      <div className="dsr__scroll" ref={scrollRef}>
        <div className="dsr__inner">
          {/* --- Masthead ------------------------------------------------- */}
          <header className="dsr__masthead" data-rise style={{ '--rise': 0 }}>
            <div>
              <p className="dsr__eyebrow mono">Curriculum Vitae · Technical Experience</p>
              <h2 className="dsr__name">{identity.name}</h2>
              <p className="dsr__headline">{identity.headline}</p>
              <p className="dsr__meta mono">
                {identity.location} · {identity.languages}
              </p>
            </div>

            <div className="dsr__actions">
              <button
                type="button"
                className="dsr-return"
                onClick={returnToOrbit}
                aria-label="Back to orbit — return to the solar system"
              >
                <OrbitGlyph />
                <span>Back to orbit</span>
              </button>
              <SocialLinks />
            </div>
          </header>

          {/* --- The numbers, before the prose ---------------------------- */}
          <ul className="dsr__stats" data-rise style={{ '--rise': 1 }}>
            {stats.map((s) => (
              <li key={s.from + s.label} style={{ '--accent': s.accent }}>
                <span className="dsr__stat-value mono">{s.value}</span>
                <span className="dsr__stat-label">{s.label}</span>
                <span className="dsr__stat-from mono">{s.from}</span>
              </li>
            ))}
          </ul>

          {/* --- Rail + body ---------------------------------------------- */}
          <div className="dsr__body" data-rise style={{ '--rise': 2 }}>
            {/* THE CONTENTS, as a trajectory.
                Six equally-weighted rows of link text competed with the
                document for attention and told the reader nothing they could
                not get by scrolling. This is a spine with a body on it for each
                section: at rest only the section being READ carries its name,
                the rest are points of light, and the spine fills behind you as
                you go. Unobtrusive until you reach for it, and it answers
                "where am I" without being asked. */}
            <nav className="dsr__rail" aria-label="Sections">
              <ol style={{ '--progress': (activeIndex + 1) / cvSections.length }}>
                {cvSections.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={`dsr__rail-item ${current === s.id ? 'is-active' : ''}`}
                      aria-current={current === s.id ? 'true' : undefined}
                      onClick={() => setCvSection(s.id)}
                    >
                      <span className="dsr__rail-dot" aria-hidden="true" />
                      <span className="dsr__rail-text">
                        <span className="dsr__rail-code mono">{s.code}</span>
                        <span className="dsr__rail-label">{s.label}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="dsr__content">
              {cvSections.map((s) => (
                <section
                  key={s.id}
                  className="dsr__section"
                  data-cv-id={s.id}
                  ref={(el) => (sectionRefs.current[s.id] = el)}
                >
                  <div className="dsr__section-head">
                    <span className="dsr__section-code mono">{s.code}</span>
                    <h3>{s.label}</h3>
                  </div>
                  <SectionBody section={s} onOpen={focusBody} />
                </section>
              ))}

              <footer className="dsr__foot">
                <p className="mono">{identity.languages}</p>
                <button type="button" className="dsr-return" onClick={returnToOrbit}>
                  <OrbitGlyph />
                  <span>Back to orbit</span>
                </button>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
