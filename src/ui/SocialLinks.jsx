import { identity } from '../data/cv'

// The contact row, used in BOTH the 3D view and the CV.
//
// It exists as one component for one reason: these were previously two separate
// implementations — icon buttons in the HUD, text links in the CV — which meant
// two hover behaviours, two type treatments and two places to edit when an
// address changes. One component, one stylesheet rule, both places.
//
// THE HOVER
// At rest this is three quiet glyphs. On hover — or on keyboard focus — the
// handle unfurls beside the mark, so the resting interface stays uncluttered
// and the identity is revealed on intent rather than shouted permanently.
//
// The reveal animates `grid-template-columns` from 0fr to 1fr, which is the one
// technique that animates an element from nothing to its own intrinsic width
// with no magic max-width guess to go stale when an address changes. See
// .social-link__reveal in ui.css.
const LINKS = [
  {
    id: 'email',
    label: 'Email',
    handle: identity.contact.email,
    href: `mailto:${identity.contact.email}`,
    path: 'M3 5h18a1 1 0 0 1 1 1v.4l-10 6.1L2 6.4V6a1 1 0 0 1 1-1Zm19 3.7V18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8.7l9.48 5.78a1 1 0 0 0 1.04 0L22 8.7Z',
  },
  {
    id: 'github',
    label: 'GitHub',
    handle: 'Ganymede-0',
    href: identity.contact.github,
    external: true,
    path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    handle: 'sarah-altheeb',
    href: identity.contact.linkedin,
    external: true,
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.454C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z',
  },
]

export default function SocialLinks({ className = '' }) {
  return (
    <nav className={`social-links ${className}`} aria-label="Contact">
      {LINKS.map((l) => (
        <a
          key={l.id}
          className="social-link"
          href={l.href}
          aria-label={`${l.label}: ${l.handle}`}
          {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path d={l.path} fill="currentColor" />
          </svg>
          {/* aria-hidden: the accessible name above already carries the handle,
              so a screen reader should not hear it a second time. */}
          <span className="social-link__reveal" aria-hidden="true">
            <span>{l.handle}</span>
          </span>
        </a>
      ))}
    </nav>
  )
}
