import { create } from 'zustand'

// Two levels of state, deliberately separate.
//
// stage: 'prologue' -> the scroll-driven approach; the page scrolls, the
//                      prologue owns the camera, and the HUD is hidden.
//        'system'    -> arrived; free-look orbital system, page scroll locked.
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
  stage: 'prologue',
  // Set once the visitor has arrived and seen the "select a body" cue, so the
  // onboarding never nags on a second visit to the overview.
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
  enterSystem: () =>
    set({ stage: 'system', view: 'overview', activeId: null, cvOpen: false }),

  dismissOnboarding: () => set({ onboarded: true }),

  // Replaying the approach. Anything focused is released first, otherwise the
  // camera would be fighting a focus tween the moment scroll takes over.
  returnToPrologue: () =>
    set({ stage: 'prologue', view: 'overview', activeId: null, cvOpen: false }),

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
