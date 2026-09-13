import { useState } from 'react'
import { useNavigationStore } from '../state/navigationStore'
import { useReducedMotion } from '../scene/useReducedMotion'

// -----------------------------------------------------------------------------
// THE CERTIFICATE, inside the Experience panel.
//
// It used to hang in 3D space beside the station. That was the wrong place for
// it twice over: a document rendered 2cm tall at forty degrees to the camera
// cannot be READ, and it had to compete for clicks with the star behind it —
// which is a fight it lost, because the star is enormous and the plaque is not.
// Here it is a document at document size, in the panel about the job it
// certifies.
//
// The flourish survives the move. Clicking it turns it once through a full
// rotation on its own vertical axis — a real 3D transform with perspective and
// a backface, not a fade — and sounds the same note it always did.
//
// The click does two things: it bumps a counter in the store, which is what the
// audio director turns into the note, and it sets the local flag that runs the
// turn. The sound stays in the director with every other cue in the app rather
// than being played from here, and the animation stays local because nothing
// else in the app has any business starting it.
// -----------------------------------------------------------------------------

export default function CertificateCard({ certificate, accent }) {
  const spinCertificate = useNavigationStore((s) => s.spinCertificate)
  const reducedMotion = useReducedMotion()
  const [spinning, setSpinning] = useState(false)

  return (
    <section className="cert" style={accent ? { '--accent': accent } : undefined}>
      <div className="cert__stage">
        <button
          type="button"
          className={`cert__card ${spinning ? 'is-spinning' : ''}`}
          onClick={() => {
            spinCertificate()
            if (!reducedMotion) setSpinning(true)
          }}
          onAnimationEnd={() => setSpinning(false)}
          aria-label={`${certificate.label} — turn it over`}
        >
          <img
            src={`${import.meta.env.BASE_URL}${certificate.full ?? certificate.src}`}
            alt={certificate.label}
            loading="lazy"
            decoding="async"
          />
        </button>
      </div>

      <p className="cert__meta mono">
        {certificate.label}
        {certificate.issued ? ` · issued ${certificate.issued}` : ''}
      </p>
    </section>
  )
}
