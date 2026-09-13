import { useNavigationStore } from '../state/navigationStore'

// -----------------------------------------------------------------------------
// THE LETTER, in the Experience panel — directly under the certificate.
//
// The certificate proves the internship happened. The letter says how it went,
// in someone else's words, and that is the more persuasive document of the two.
// So the card leads with those words: one line quoted verbatim, attributed, set
// large enough to read at a glance before anyone decides whether to open it.
//
// Above the quote is the page itself — the letterhead and the opening
// paragraphs, fading out into the panel. It is what makes the quote credible:
// this is a real letter on company paper, not a line typed into a portfolio.
// Clicking it opens the full page in the reader, inside the site. Nothing here
// opens a tab or hands the visitor a PDF.
//
// The full-resolution page is warmed on hover and focus, so by the time the
// click lands the reader usually has its pixels already.
// -----------------------------------------------------------------------------

const BASE = import.meta.env.BASE_URL

let warmed = false
function warm(src) {
  if (warmed) return
  warmed = true
  const img = new Image()
  img.decoding = 'async'
  img.src = src
}

export default function LetterCard({ letter, accent }) {
  const openLetter = useNavigationStore((s) => s.openLetter)
  const full = `${BASE}${letter.full}`

  return (
    <section
      className="letter"
      style={accent ? { '--accent': accent } : undefined}
      aria-label={`${letter.label} from ${letter.author}`}
    >
      <button
        type="button"
        className="letter__page"
        onClick={openLetter}
        onPointerEnter={() => warm(full)}
        onFocus={() => warm(full)}
        aria-label={`Read the ${letter.label.toLowerCase()} from ${letter.author}`}
        aria-haspopup="dialog"
      >
        <img
          src={`${BASE}${letter.preview}`}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <span className="letter__fade" aria-hidden="true" />
        <span className="letter__open" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path
              d="M10.5 3.5a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm9.5 17-4.6-4.6M10.5 7.5v6M7.5 10.5h6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
          Read the letter
        </span>
      </button>

      <figure className="letter__quote">
        <blockquote>
          <p>{letter.excerpt}</p>
        </blockquote>
        <figcaption>
          <span className="letter__author">{letter.author}</span>
          <span className="letter__role">
            {letter.role} · {letter.org}
          </span>
        </figcaption>
      </figure>
    </section>
  )
}
