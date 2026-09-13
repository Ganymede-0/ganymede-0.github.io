import { useNavigationStore } from '../state/navigationStore'
import { playUnmute } from '../audio/piano'

// The mute control, top of the interface and always present — including over
// the CV, which is the one view that hides the rest of the HUD. A sound control
// a visitor cannot find while sound is playing is not a sound control.
//
// It is a real <button> with aria-pressed, so a screen reader announces the
// state rather than the icon, and it is reachable by keyboard from the first
// Tab press.
export default function SoundToggle() {
  const muted = useNavigationStore((s) => s.muted)
  const toggleMute = useNavigationStore((s) => s.toggleMute)

  return (
    <button
      type="button"
      className={`sound-toggle ${muted ? 'is-muted' : ''}`}
      aria-pressed={!muted}
      aria-label={muted ? 'Sound off. Turn sound on' : 'Sound on. Turn sound off'}
      onClick={() => {
        const wasMuted = useNavigationStore.getState().muted
        toggleMute()
        // Confirm by playing, but only when turning sound ON — and only after
        // the flag has cleared, or the note would mute itself.
        if (wasMuted) playUnmute()
      }}
    >
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        {/* The speaker cone, always drawn. */}
        <path d="M4 9.5h3.2L11.5 6v12L7.2 14.5H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" fill="currentColor" />
        {muted ? (
          <path d="M15 9.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        ) : (
          <>
            <path d="M14.6 9.2a4 4 0 0 1 0 5.6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M17.3 6.8a7.6 7.6 0 0 1 0 10.4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.75" />
          </>
        )}
      </svg>
      <span className="sound-toggle__label">{muted ? 'Sound off' : 'Sound on'}</span>
    </button>
  )
}
