import { create } from 'zustand'

// view: 'overview'      -> free-look orbital system, nothing focused
//       'transitioning' -> camera is mid-flight (controls disabled)
//       'focus'          -> parked at a body, mission panel open
export const useNavigationStore = create((set, get) => ({
  view: 'overview',
  activeId: null,
  hoveredId: null,

  setHovered: (id) => set({ hoveredId: id }),

  focusBody: (id) => {
    if (get().view === 'transitioning') return
    set({ view: 'transitioning', activeId: id })
  },

  arrivedAtBody: () => set({ view: 'focus' }),

  returnToOverview: () => {
    if (get().view === 'transitioning') return
    set({ view: 'transitioning', activeId: null })
  },

  arrivedAtOverview: () => set({ view: 'overview', activeId: null }),
}))
