import { create } from 'zustand'

// Two levels of state, deliberately separate.
//
// stage: 'system'   -> the landing view. Free-look orbital system, page scroll
//                      locked. Everything is reachable from here.
//        'diving'   -> the warp: the camera falls into the star while streaks
//                      rush past and the screen blooms white. ~1.4s, on rails.
//        'cv'       -> through the star: the full CV is open and the camera is
//                      parked at the photosphere behind it.
//        'emerging' -> "Back to orbit" from the warp: the camera pulls back out
//                      of the star to the system framing, so the return is a
//                      reveal rather than a cut. ~1.9s.
//
// view:  'overview'      -> free-look orbital system, nothing focused
//        'transitioning' -> camera is mid-flight (controls disabled)
//        'focus'         -> parked at a body, mission panel open
//
// `view` only means anything while stage is 'system'. Keeping the two separate
// is what let the warp be added without touching the focus/flight system at all:
// the warp simply holds the camera before any of it runs.
export const useNavigationStore = create((set, get) => ({
  stage: 'system',

  // Pointer is over the star or its title. Both are the same door, so hovering
  // either lights the title up.
  sunHovered: false,

  view: 'overview',
  activeId: null,
  hoveredId: null,

  // CV overlay: independent of the 3D focus state. `cvSection` is the section
  // the panel should scroll to when it opens (or changes while open).
  cvOpen: false,
  cvSection: null,

  // Product walkthrough overlay. `dossierIndex` is a position in the project's
  // flattened media reel, so opening from a specific thumbnail and opening from
  // the panel's main button are the same action with a different starting
  // frame.
  dossierOpen: false,
  dossierIndex: 0,

  // The recommendation-letter reader: a full-screen overlay over the mission
  // panel, like the walkthrough, and closed the same way.
  letterOpen: false,

  // --- Sound ----------------------------------------------------------------
  // Off is remembered across visits. Defaulting to ON is defensible only because
  // nothing here plays unprompted: every sound in the app is the direct answer
  // to a click the visitor just made. Nothing makes noise on load.
  muted: (() => {
    try {
      return localStorage.getItem('ganymede.muted') === '1'
    } catch {
      // Private mode, or site data blocked. Sound on, and no crash.
      return false
    }
  })(),

  toggleMute: () =>
    set((s) => {
      const muted = !s.muted
      try {
        localStorage.setItem('ganymede.muted', muted ? '1' : '0')
      } catch {
        // Nothing to do — the preference simply will not survive a reload.
      }
      return { muted }
    }),

  // The certificate on the Experience station. A counter rather than a
  // boolean: every click is a distinct event, and both the spin animation and
  // the sound key off the change, so they cannot fall out of step.
  certificateSpin: 0,
  spinCertificate: () => set((s) => ({ certificateSpin: s.certificateSpin + 1 })),

  // Catching the rocket mid-flight. A counter for the same reason: every catch
  // is its own event, and the sound is driven by the change rather than by the
  // click handler, so it stays in the audio director with everything else.
  rocketCatches: 0,
  catchRocket: () => set((s) => ({ rocketCatches: s.rocketCatches + 1 })),

  // The emblem beside the name. Same pattern again: a counter, so the sound
  // lives with every other cue in the audio director rather than in a handler.
  emblemSpins: 0,
  spinEmblem: () => set((s) => ({ emblemSpins: s.emblemSpins + 1 })),

  setHovered: (id) => set({ hoveredId: id }),
  setSunHovered: (v) => set({ sunHovered: v }),

  // --- The warp -------------------------------------------------------------
  // Clicking the star (or the title behind it) starts the DIVE. Anything open
  // is released first, otherwise the camera would be fighting a focus tween the
  // moment the dive takes over.
  //
  // Takes NO arguments. It is wired straight to onClick handlers, and React
  // passes the click event as the first argument — any parameter here would
  // silently receive a SyntheticEvent instead of what it expected.
  warpToCv: () => {
    if (get().stage !== 'system') return
    set({
      stage: 'diving',
      view: 'overview',
      activeId: null,
      cvOpen: false,
      dossierOpen: false,
      letterOpen: false,
      sunHovered: false,
    })
  },

  // Called by StarDive at the one frame where the screen is pure white. The CV
  // opens under cover of that light, so it is simply there when it clears.
  enterCv: () => set({ stage: 'cv', cvOpen: true, cvSection: null }),

  // --- Back to orbit --------------------------------------------------------
  // One action for the CV's return control, whichever way the CV was opened.
  //   From the warp: pull the camera back out of the star.
  //   From the HUD:  close the CV and glide the camera back to the default
  //                  framing, so "back to orbit" always lands in the same place
  //                  however far the visitor had dragged the system around.
  returnToOrbit: () => {
    const { stage, view } = get()
    if (stage === 'cv') {
      set({ cvOpen: false, stage: 'emerging' })
      return
    }
    if (stage !== 'system') return
    set(
      view === 'transitioning'
        ? { cvOpen: false }
        : { cvOpen: false, view: 'transitioning', activeId: null }
    )
  },

  // Called by StarDive when the camera has finished rising out of the star.
  // If the visitor left the CV by choosing a project ("View in orbit"), that
  // body is still in `activeId`, and landing hands it straight to the camera
  // rig for the flight.
  landInSystem: () =>
    set((s) => ({ stage: 'system', view: s.activeId ? 'transitioning' : 'overview' })),

  focusBody: (id) => {
    const { stage, view } = get()

    // Chosen from inside the warp: rise out of the star first. landInSystem
    // picks the body up from `activeId` once the camera is back in the system.
    if (stage === 'cv') {
      set({ activeId: id, cvOpen: false, stage: 'emerging' })
      return
    }
    if (stage !== 'system' || view === 'transitioning') return

    // Opening a body from the CV closes the CV so the camera flight is unobscured.
    set({ view: 'transitioning', activeId: id, cvOpen: false })
  },

  arrivedAtBody: () => set({ view: 'focus' }),

  returnToOverview: () => {
    if (get().view === 'transitioning') return
    // The letter belongs to the panel being closed; it must not survive it and
    // reopen over whichever body the visitor picks next.
    set({ view: 'transitioning', activeId: null, letterOpen: false })
  },

  arrivedAtOverview: () => set({ view: 'overview', activeId: null }),

  // The dossier opens OVER the mission panel rather than replacing it: closing
  // it returns the visitor to the project they were already reading, with the
  // camera still parked at that body. Nothing about the 3D state changes.
  openDossier: (index = 0) => set({ dossierOpen: true, dossierIndex: index }),
  setDossierIndex: (index) => set({ dossierIndex: index }),
  closeDossier: () => set({ dossierOpen: false }),

  openLetter: () => set({ letterOpen: true }),
  closeLetter: () => set({ letterOpen: false }),

  openCv: (section = null) => set({ cvOpen: true, cvSection: section }),
  setCvSection: (section) => set({ cvSection: section }),

  // Escape and the backdrop. Inside the warp, closing the CV IS going back to
  // orbit — otherwise the visitor would be left staring at the inside of a
  // star with nothing on screen and no way out.
  closeCv: () => {
    if (get().stage === 'cv') {
      get().returnToOrbit()
      return
    }
    set({ cvOpen: false })
  },
}))

// Whether a body's floating name label should render.
//
// These are drei <Html> portals: they mount into their own DOM layer stacked
// ABOVE the canvas, so a label will punch straight through any overlay panel no
// matter what z-index that panel carries. Not rendering is the only reliable
// fix, which makes this the single place that decides when they are allowed.
//
// Hidden during the warp, during camera flights, and behind an open CV.
export const useLabelsVisible = () =>
  useNavigationStore((s) => s.stage === 'system' && s.view === 'overview' && !s.cvOpen)
