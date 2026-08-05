import CvNav from './CvNav'
import { useNavigationStore } from '../state/navigationStore'

// Contact channels. The handle is hidden until hover, then unfurls beside the
// mark — so the resting HUD stays three quiet glyphs instead of a row of link
// text, and the identity is revealed on intent.
const CONTACTS = [
  {
    id: 'github',
    label: 'GitHub',
    handle: 'Ganymede-0',
    href: 'https://github.com/ganymede-0',
    path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    handle: 'sarah-altheeb',
    href: 'https://linkedin.com/in/sarah-altheeb',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.454C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z',
  },
  {
    id: 'email',
    label: 'Email',
    handle: 'sarah.altheeeb@gmail.com',
    href: 'mailto:sarah.altheeeb@gmail.com',
    path: 'M3 5h18a1 1 0 0 1 1 1v.4l-10 6.1L2 6.4V6a1 1 0 0 1 1-1Zm19 3.7V18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8.7l9.48 5.78a1 1 0 0 0 1.04 0L22 8.7Z',
  },
]

// The persistent HUD: who this is, and the CV-centric jump navigation in the
// bottom-left (see CvNav). Nothing in this portfolio is reachable *only* by
// clicking a moving 3D object — the CV nav is the keyboard accessibility floor.
export default function Hud() {
  const stage = useNavigationStore((s) => s.stage)
  const view = useNavigationStore((s) => s.view)
  const returnToPrologue = useNavigationStore((s) => s.returnToPrologue)

  // The approach sequence states the identity at full size and carries its own
  // chrome. Running the HUD underneath it would duplicate the name and crowd
  // the reading column on a phone.
  if (stage !== 'system') return null

  return (
    <>
      <header className="hud hud--identity">
        <h1 className="identity__name">Sarah Altheeb</h1>
        <p className="identity__role mono">
          AI Engineer · Computer Vision · Industrial AI · MLOps
        </p>
        <p className="identity__location mono">Al Khobar · Eastern Province, KSA</p>
        {/* The approach is a one-way trip by default; this is the way back to
            it. Worth having — the intro carries the narrative framing, and a
            visitor who skipped straight in has no other route to it. */}
        <button
          type="button"
          className="identity__replay mono"
          onClick={returnToPrologue}
        >
          <span aria-hidden="true">↑</span> Replay the approach
        </button>
      </header>

      <CvNav />

      <footer className="hud hud--contact">
        {CONTACTS.map((c) => (
          <a
            key={c.id}
            className="contact-link"
            href={c.href}
            aria-label={`${c.label}: ${c.handle}`}
            {...(c.id === 'email' ? {} : { target: '_blank', rel: 'noreferrer' })}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path d={c.path} fill="currentColor" />
            </svg>
            {/* grid 0fr -> 1fr is the one technique that animates an
                intrinsic width cleanly, with no magic max-width guess. */}
            <span className="contact-link__reveal" aria-hidden="true">
              <span>{c.handle}</span>
            </span>
          </a>
        ))}
      </footer>

      {view === 'overview' && (
        <p className="hud hud--hint mono">Drag to orbit · select a body to open the project</p>
      )}
    </>
  )
}
