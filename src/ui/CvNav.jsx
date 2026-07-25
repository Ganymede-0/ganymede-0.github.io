import { cvSections } from '../data/cv'
import { useNavigationStore } from '../state/navigationStore'

// Bottom-left navigation, repurposed from the old "Mission index" into a
// CV-centric jump menu. Each item opens the résumé panel scrolled to that
// section — so a recruiter can move through the history without ever hunting
// for a moving 3D object. This is also the accessibility floor: every part of
// the story is reachable here by keyboard.
export default function CvNav() {
  const openCv = useNavigationStore((s) => s.openCv)
  const cvOpen = useNavigationStore((s) => s.cvOpen)
  const cvSection = useNavigationStore((s) => s.cvSection)

  return (
    <nav className="hud cv-nav" aria-label="Résumé navigation">
      <p className="cv-nav__caption">Curriculum Vitae</p>
      <ul>
        {cvSections.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={`cv-nav__item ${cvOpen && cvSection === s.id ? 'is-active' : ''}`}
              onClick={() => openCv(s.id)}
            >
              <span className="cv-nav__code">{s.code}</span>
              <span className="cv-nav__label">{s.label}</span>
              <span className="cv-nav__arrow" aria-hidden="true">→</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
