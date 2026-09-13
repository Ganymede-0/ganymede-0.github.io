import { useEffect } from 'react'
import { useNavigationStore } from '../state/navigationStore'
import { projects } from '../data/projects'
import {
  playBody,
  playWarp,
  playReturn,
  playOpen,
  playClose,
  playCertificate,
  playRocket,
  playBack,
  playEmblem,
} from '../audio/piano'

// -----------------------------------------------------------------------------
// Every sound in the app is triggered from here, by watching the store for the
// transitions that deserve one.
//
// WHY CENTRALISED
// The alternative is a play() call in every component that owns a click — in
// Planet, in Station, in Sun, in three different panels — and the moment sound
// lives in six files it starts being played twice for one action, or forgotten
// for another. One subscription, one table of transitions, one place to read to
// know exactly what this site can make a noise about.
//
// The subscriber runs SYNCHRONOUSLY inside the store's set(), which is itself
// inside the click handler — so the browser still sees these notes as part of a
// user gesture and lets the AudioContext start. Deferring this to an effect
// would break audio on the very first click.
// -----------------------------------------------------------------------------

export default function AudioDirector() {
  useEffect(() => {
    return useNavigationStore.subscribe((s, p) => {
      // The emblem beside the name.
      if (s.emblemSpins !== p.emblemSpins) return playEmblem()

      // The rocket, caught mid-flight.
      if (s.rocketCatches !== p.rocketCatches) return playRocket()

      // The certificate, struck.
      if (s.certificateSpin !== p.certificateSpin) return playCertificate()

      // The warp into the CV — the biggest gesture on the site.
      if (s.stage !== p.stage && s.stage === 'diving') return playWarp()
      // Rising back out of the star.
      if (s.stage !== p.stage && s.stage === 'emerging') return playReturn()

      // A body was selected. Pitch is per project and fixed, so each planet
      // always answers in its own voice — Raha is always the same note.
      if (s.activeId && s.activeId !== p.activeId) {
        const i = projects.findIndex((x) => x.id === s.activeId)
        return playBody(i < 0 ? 0 : i)
      }

      // Stepping back out of a body's panel to the system. Fires on the way
      // OUT only — arriving at a body already has its own note.
      if (!s.activeId && p.activeId && s.stage === 'system') return playBack()

      // The CV opened from the HUD nav rather than through the warp; the warp
      // has its own, larger cue and must not get two.
      if (s.cvOpen && !p.cvOpen && s.stage === 'system') return playOpen()
      if (!s.cvOpen && p.cvOpen && s.stage === 'system') return playClose()

      // The product walkthrough.
      if (s.dossierOpen && !p.dossierOpen) return playOpen()
      if (!s.dossierOpen && p.dossierOpen) return playClose()
    })
  }, [])

  return null
}
