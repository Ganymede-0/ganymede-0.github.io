import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { getProjectById } from '../data/projects'
import { useNavigationStore } from '../state/navigationStore'
import { useReducedMotion } from '../scene/useReducedMotion'

// --- Signature element -------------------------------------------------------
// The panel's header rule is the selected body's orbit. It arrives as the same
// dashed curve you were just looking at in 3D, then flattens into a straight
// rule as the panel settles — the trajectory literally becomes the line the
// project is written on. It's the one flourish in the UI layer; everything
// below it is deliberately flat, quiet, and readable.
const CURVED = 'M 0 26 Q 160 0 320 26'
const FLAT = 'M 0 26 Q 160 26 320 26'

function OrbitRule({ color, reducedMotion }) {
  const pathRef = useRef()

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    if (reducedMotion) {
      path.setAttribute('d', FLAT)
      return
    }
    const proxy = { cy: 0 }
    path.setAttribute('d', CURVED)
    const tween = gsap.to(proxy, {
      cy: 26,
      duration: 0.9,
      ease: 'power3.out',
      delay: 0.15,
      onUpdate: () => path.setAttribute('d', `M 0 26 Q 160 ${proxy.cy} 320 26`),
    })
    return () => tween.kill()
  }, [color, reducedMotion])

  return (
    <svg className="orbit-rule" viewBox="0 0 320 30" preserveAspectRatio="none" aria-hidden="true">
      <path
        ref={pathRef}
        d={CURVED}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="6 5"
      />
    </svg>
  )
}

export default function MissionPanel() {
  const activeId = useNavigationStore((s) => s.activeId)
  const view = useNavigationStore((s) => s.view)
  const returnToOverview = useNavigationStore((s) => s.returnToOverview)
  const reducedMotion = useReducedMotion()
  const panelRef = useRef()

  const project = activeId ? getProjectById(activeId) : null
  const open = view === 'focus' && !!project

  useEffect(() => {
    if (!open || !panelRef.current) return
    const el = panelRef.current
    if (reducedMotion) {
      gsap.set(el, { opacity: 1, x: 0 })
      return
    }
    const tween = gsap.fromTo(
      el,
      { opacity: 0, x: 28 },
      { opacity: 1, x: 0, duration: 0.55, ease: 'power2.out' }
    )
    return () => tween.kill()
  }, [open, activeId, reducedMotion])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open) returnToOverview()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, returnToOverview])

  if (!open) return null

  return (
    <aside
      className="mission-panel"
      ref={panelRef}
      aria-label={`${project.name} project`}
      style={{ '--accent': project.color }}
    >
      <OrbitRule color={project.color} reducedMotion={reducedMotion} />

      <header className="mission-panel__header">
        <div className="mission-panel__eyebrow">
          <span className="mono">{project.missionCode}</span>
          <span className="mission-panel__dot" aria-hidden="true" />
          <span className="mono">
            {project.category === 'station' ? 'Experience' : 'Project'}
          </span>
        </div>
        <h2 className="mission-panel__title">{project.name}</h2>
        <p className="mission-panel__tagline">{project.tagline}</p>
      </header>

      <div className="mission-panel__body">
        <p className="mission-panel__summary">{project.summary}</p>

        {project.metrics.length > 0 && (
          <div className="readout">
            {project.metrics.map((m) => (
              <div className="readout__cell" key={m.label}>
                <span className="readout__value mono">{m.value}</span>
                <span className="readout__label">{m.label}</span>
              </div>
            ))}
          </div>
        )}

        <section className="mission-panel__section">
          <h3>The problem</h3>
          <p>{project.problem}</p>
        </section>

        <section className="mission-panel__section">
          <h3>What I built</h3>
          <p>{project.approach}</p>
        </section>

        <section className="mission-panel__section">
          <h3>Stack</h3>
          <ul className="chips">
            {project.stack.map((s) => (
              <li className="chip mono" key={s}>{s}</li>
            ))}
          </ul>
        </section>

        <section className="mission-panel__section">
          <h3>Core competencies</h3>
          <ul className="chips chips--quiet">
            {project.competencies.map((c) => (
              <li className="chip chip--quiet" key={c}>{c}</li>
            ))}
          </ul>
        </section>

        {project.links.length > 0 && (
          <div className="mission-panel__links">
            {project.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="link-button">
                {l.label}
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <footer className="mission-panel__footer">
        <button type="button" className="ghost-button" onClick={returnToOverview}>
          Back to the system
        </button>
        <span className="mission-panel__hint mono">Esc</span>
      </footer>
    </aside>
  )
}
