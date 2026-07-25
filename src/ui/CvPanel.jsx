import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { identity, cvSections } from '../data/cv'
import { useNavigationStore } from '../state/navigationStore'
import { useReducedMotion } from '../scene/useReducedMotion'

// Renders the body of one section based on its `kind`. Kept as a plain function
// (not a component) so it doesn't add to the React tree or re-render churn.
function SectionBody({ section, focusBody }) {
  switch (section.kind) {
    case 'prose':
      return <p className="cv-prose">{section.body}</p>

    case 'timeline':
      return (
        <div className="cv-timeline">
          {section.items.map((it, i) => (
            <article className="cv-entry" key={i}>
              <div className="cv-entry__row">
                <h4>{it.role}</h4>
                <span className="cv-entry__period">{it.period}</span>
              </div>
              <p className="cv-entry__org">{it.org}</p>
              <ul className="cv-entry__points">
                {it.points.map((p, j) => <li key={j}>{p}</li>)}
              </ul>
            </article>
          ))}
        </div>
      )

    case 'projects':
      return (
        <div className="cv-systems">
          {section.items.map((it, i) => (
            <article className="cv-system" key={i}>
              <div className="cv-entry__row">
                <h4>{it.name}</h4>
                <span className="cv-entry__period">{it.period}</span>
              </div>
              <p className="cv-system__blurb">{it.blurb}</p>
              {it.badge && <p className="cv-system__badge">{it.badge}</p>}
              <ul className="cv-chips">
                {it.stack.map((s) => <li key={s} className="cv-chip">{s}</li>)}
              </ul>
              {it.projectId && (
                <button
                  type="button"
                  className="cv-orbit-link"
                  onClick={() => focusBody(it.projectId)}
                >
                  View in orbit <span aria-hidden="true">↗</span>
                </button>
              )}
            </article>
          ))}
        </div>
      )

    case 'stack':
      return (
        <div className="cv-stack">
          {section.groups.map((g) => (
            <div className="cv-stack__group" key={g.label}>
              <p className="cv-stack__label">{g.label}</p>
              <ul className="cv-chips">
                {g.items.map((s) => <li key={s} className="cv-chip">{s}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )

    case 'list':
      return (
        <ul className="cv-awards">
          {section.items.map((it, i) => (
            <li className="cv-award" key={i}>
              <p className="cv-award__title">{it.title}</p>
              <p className="cv-award__detail">{it.detail}</p>
            </li>
          ))}
        </ul>
      )

    default:
      return null
  }
}

export default function CvPanel() {
  const cvOpen = useNavigationStore((s) => s.cvOpen)
  const cvSection = useNavigationStore((s) => s.cvSection)
  const setCvSection = useNavigationStore((s) => s.setCvSection)
  const closeCv = useNavigationStore((s) => s.closeCv)
  const focusBody = useNavigationStore((s) => s.focusBody)
  const reducedMotion = useReducedMotion()

  const panelRef = useRef()
  const sectionRefs = useRef({})

  // Slide-in on open.
  useEffect(() => {
    if (!cvOpen || !panelRef.current) return
    const el = panelRef.current
    if (reducedMotion) {
      gsap.set(el, { x: 0, opacity: 1 })
      return
    }
    const t = gsap.fromTo(
      el,
      { x: -40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
    )
    return () => t.kill()
  }, [cvOpen, reducedMotion])

  // Scroll to the requested section when it opens or changes.
  useEffect(() => {
    if (!cvOpen || !cvSection) return
    const node = sectionRefs.current[cvSection]
    if (node) {
      node.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
    }
  }, [cvOpen, cvSection, reducedMotion])

  // Esc closes.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && cvOpen) closeCv()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cvOpen, closeCv])

  if (!cvOpen) return null

  return (
    <>
      <div className="cv-backdrop" onClick={closeCv} aria-hidden="true" />
      <aside className="cv-panel" ref={panelRef} aria-label={`${identity.name} — résumé`}>
        <header className="cv-panel__head">
          <div>
            <p className="cv-panel__eyebrow">Curriculum Vitae</p>
            <h2 className="cv-panel__name">{identity.name}</h2>
            <p className="cv-panel__headline">{identity.headline}</p>
          </div>
          <button type="button" className="cv-close" onClick={closeCv} aria-label="Close résumé">
            ✕
          </button>
        </header>

        <nav className="cv-tabs" aria-label="Résumé sections">
          {cvSections.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`cv-tab ${cvSection === s.id ? 'is-active' : ''}`}
              onClick={() => setCvSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="cv-scroll">
          {cvSections.map((s) => (
            <section
              key={s.id}
              className="cv-section"
              ref={(el) => (sectionRefs.current[s.id] = el)}
            >
              <div className="cv-section__head">
                <span className="cv-section__code">{s.code}</span>
                <h3>{s.label}</h3>
              </div>
              <SectionBody section={s} focusBody={focusBody} />
            </section>
          ))}

          <footer className="cv-panel__foot">
            <div className="cv-panel__links">
              <a href={identity.contact.github} target="_blank" rel="noreferrer">GitHub</a>
              <a href={identity.contact.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
              <a href={`mailto:${identity.contact.email}`}>Email</a>
            </div>
            <p className="cv-panel__langs">{identity.languages}</p>
          </footer>
        </div>
      </aside>
    </>
  )
}
