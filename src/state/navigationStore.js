import { create } from 'zustand'

// Two levels of state, deliberately separate.
//
// stage: 'system'    -> the landing view. Free-look orbital system, page scroll
//                       locked. Everything is reachable from here.
//        'diving'    -> the camera is falling into the star. ~1.4s, on rails.
//        'prologue'  -> inside the star: the story, in its own dark space. The
//                       page scrolls and the prologue owns the camera.
//        'returning' -> the wormhole burst carrying the visitor back out. ~1s.
//
// The two transitional stages exist so that entering and leaving the story are
// authored moments rather than cuts. They are the only states in the app where
// neither the visitor nor the scroll position controls the camera.
//
// view:  'overview'      -> free-look orbital system, nothing focused
//        'transitioning' -> camera is mid-flight (controls disabled)
//        'focus'          -> parked at a body, mission panel open
//
// `view` is meaningless while stage is 'prologue'. Keeping them separate means
// the entire existing focus/flight system needed no changes to accommodate the
// approach sequence — the prologue simply holds the camera before any of it
// starts.
export const useNavigationStore = create((set, get) => ({
  // The SYSTEM is the landing view, not the approach sequence.
  //
  // This is deliberate and it is the most important UX decision in the file. A
  // narrative intro that plays before anything else is a toll gate: a recruiter
  // with sixty seconds pays it before seeing a single project. Landing in the
  // system means the work is immediately available, and the story becomes an
  // invitation — offered by the star, taken only by someone who wants it.
  stage: 'system',

  // Whether the approach has been run to completion (or skipped) at least once.
  // Controls whether the star still advertises itself with "Start here".
  hasSeenApproach: false,

  // Pointer is over the photosphere. After the first run the star carries no
  // permanent label — the invitation surfaces only on hover, so the body stays
  // a star rather than a button with a star behind it.
  sunHovered: false,

  // Set once the visitor has seen the "select a body" cue, so the onboarding
  // never nags on a second visit to the overview.
  onboarded: false,

  view: 'overview',
  activeId: null,
  hoveredId: null,

  // CV overlay: independent of the 3D focus state. `cvSection` is the section
  // the panel should scroll to when it opens (or changes while open).
  cvOpen: false,
  cvSection: null,

  setHovered: (id) => set({ hoveredId: id }),

  // Arrival. Called both by scrolling to the end of the approach and by the
  // skip control, so there is exactly one way into the system and one place
  // where the resulting state is defined.
  //
  // `onboarded: false` is reset here on purpose: coming out of the wormhole is
  // exactly when "each planet is a project" is worth saying, whether the
  // visitor is arriving for the first time or replaying the story.
  enterSystem: () =>
    set({
      stage: 'system',
      view: 'overview',
      activeId: null,
      cvOpen: false,
      hasSeenApproach: true,
      onboarded: false,
    }),

  dismissOnboarding: () => set({ onboarded: true }),

  setSunHovered: (v) => set({ sunHovered: v }),

  // --- Entering the story ---------------------------------------------------
  // Clicking the star begins the DIVE, not the prologue. Anything focused is
  // released first, otherwise the camera would be fighting a focus tween the
  // moment the dive takes over.
  // Takes NO arguments. It is wired straight to onClick in SunBeacon, and React
  // passes the click event as the first argument — any parameter here would
  // silently receive a SyntheticEvent instead of what it expected.
  startApproach: () => {
    if (get().stage !== 'system') return
    set({
      stage: 'diving',
      view: 'overview',
      activeId: null,
      cvOpen: false,
      sunHovered: false,
    })
  },

  // Called by StarDive when the camera has reached the photosphere and the
  // screen is fully white — the one frame where a teleport is invisible.
  enterPrologue: () => set({ stage: 'prologue' }),

  // --- Leaving the story ----------------------------------------------------
  // Reaching the end of the scroll starts the wormhole burst rather than
  // cutting straight back. `enterSystem` is what actually lands.
  beginReturn: () => {
    if (get().stage !== 'prologue') return
    set({ stage: 'returning' })
  },

  focusBody: (id) => {
    if (get().view === 'transitioning') return
    // Opening a body from the CV closes the CV so the camera flight is unobscured.
    set({ view: 'transitioning', activeId: id, cvOpen: false })
  },

  arrivedAtBody: () => set({ view: 'focus' }),

  returnToOverview: () => {
    if (get().view === 'transitioning') return
    set({ view: 'transitioning', activeId: null })
  },

  arrivedAtOverview: () => set({ view: 'overview', activeId: null }),

  openCv: (section = null) => set({ cvOpen: true, cvSection: section }),

  setCvSection: (section) => set({ cvSection: section }),
  closeCv: () => set({ cvOpen: false }),
}))

// Is the nebula arrival cue on screen?
//
// Only after the approach has been run — arriving out of the wormhole is what
// the cue is a response to. On a cold first load the star's own beacon is the
// single call to action, and two competing invitations would be one too many.
export const selectCueVisible = (s) =>
  s.stage === 'system' && s.hasSeenApproach && !s.onboarded && s.view === 'overview'

export const useCueVisible = () => useNavigationStore(selectCueVisible)

// Whether a body's floating name label should render.
//
// These are drei <Html> portals: they mount into their own DOM layer stacked
// ABOVE the canvas, so a label will punch straight through any overlay panel no
// matter what z-index that panel carries. Not rendering is the only reliable
// fix, which makes this the single place that decides when they are allowed.
//
// Hidden during the approach (labels would float over the narrative text),
// while the nebula cue is up (that cue names the bodies itself, and a label
// landing on top of it was the reported overlap), during camera flights, and
// behind either open panel.
export const useLabelsVisible = () =>
  useNavigationStore(
    (s) =>
      s.stage === 'system' &&
      !selectCueVisible(s) &&
      s.view === 'overview' &&
      !s.cvOpen
  )
