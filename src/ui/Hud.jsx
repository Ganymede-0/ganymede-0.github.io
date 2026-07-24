import { projects } from '../data/projects'
import { useNavigationStore } from '../state/navigationStore'

// The persistent HUD: who this is, how to move, and a keyboard-reachable
// index of every body in the system. The index is the accessibility floor —
// nothing in this portfolio is reachable *only* by clicking a moving 3D object.
export default function Hud() {
  const view = useNavigationStore((s) => s.view)
  const activeId = useNavigationStore((s) => s.activeId)
  const focusBody = useNavigationStore((s) => s.focusBody)
  const setHovered = useNavigationStore((s) => s.setHovered)

  return (
    <>
      <header className="hud hud--identity">
        <h1 className="identity__name">Sarah Altheeb</h1>
        <p className="identity__role mono">
          Applied AI · computer vision · 3D volumetric imaging
        </p>
        <p className="identity__location mono">Khobar, Saudi Arabia</p>
      </header>

      <nav className="hud hud--index" aria-label="Mission index">
        <p className="index__caption mono">Mission index</p>
        <ul>
          {projects.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`index__item ${activeId === p.id ? 'is-active' : ''}`}
                style={{ '--accent': p.color }}
                onClick={() => focusBody(p.id)}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(p.id)}
                onBlur={() => setHovered(null)}
              >
                <span className="index__code mono">{p.missionCode}</span>
                <span className="index__name">{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <footer className="hud hud--contact">
        <a href="https://github.com/ganymede-0" target="_blank" rel="noreferrer">GitHub</a>
        <a href="https://linkedin.com/in/sarah-altheeb" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="mailto:sarah.altheeeb@gmail.com">Email</a>
      </footer>

      {view === 'overview' && (
        <p className="hud hud--hint mono">Drag to look around · select a body to open its case study</p>
      )}
    </>
  )
}
