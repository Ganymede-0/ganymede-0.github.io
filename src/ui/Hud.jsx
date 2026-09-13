import IdentityMark from './IdentityMark'
import SocialLinks from './SocialLinks'
import { useNavigationStore } from '../state/navigationStore'

// The persistent HUD: who this is, and how to reach them.
//
// The bottom-left section index was removed — it duplicated the contents rail
// that already lives inside the CV, and it filled a corner of a view whose
// whole point is the system. The CV is reached by the star at the centre, which
// is the loudest object on screen and cannot be missed.
//
// WHAT THAT COST, AND HOW IT IS PAID FOR
// That index was also the keyboard route into the CV: without it, the only way
// in would be clicking a 3D object, which a keyboard user cannot do. So a skip
// link now sits first in the tab order — invisible until focused, standard
// practice, and it costs the layout nothing.
//
// THE IDENTITY BLOCK
// Lives in its own component now — see IdentityMark. It is a crew plate: an
// orbital emblem, a designation, the name, and the two facts that place the
// person, all in sentence case.
export default function Hud() {
  const stage = useNavigationStore((s) => s.stage)
  const view = useNavigationStore((s) => s.view)
  const activeId = useNavigationStore((s) => s.activeId)

  // Gone during the warp and while the CV it leads to is open — the CV carries
  // the same identity at full size, and the HUD underneath it would only
  // duplicate the name.
  if (stage !== 'system') return null

  return (
    <>
      {/* First in the tab order, invisible until focused. */}
      <button
        type="button"
        className="skip-to-cv"
        onClick={() => useNavigationStore.getState().openCv()}
      >
        Open the CV
      </button>

      <header className="hud hud--identity">
        <IdentityMark />
      </header>

      {/* `is-tucked` only means anything on a narrow screen, where the project
          sheet rises from the bottom edge and would bury this row. On a desktop
          the panel is a side column and the corner stays clear, so the class is
          there and the stylesheet ignores it. */}
      <footer className={`hud hud--contact${activeId ? ' is-tucked' : ''}`}>
        {/* Exactly the component the CV uses — see SocialLinks. */}
        <SocialLinks />
      </footer>

      {view === 'overview' && (
        <p className="hud hud--hint">Drag to orbit · select a body to open the project</p>
      )}
    </>
  )
}
