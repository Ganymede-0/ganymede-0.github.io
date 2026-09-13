// -----------------------------------------------------------------------------
// The instrument — a soft, resonant piano, synthesized.
//
// WHY SYNTHESIZED
// A sampled piano is 1-5 MB of audio to fetch and decode on a site whose only
// other sound is none. Additive synthesis costs nothing to ship, starts with
// zero latency, and can be retuned by changing a number.
//
// HOW A NOTE IS BUILT
// A struck string is a stack of partials over a fundamental, each quieter and
// each dying faster than the one below it, and a real string is slightly
// INHARMONIC: its stiffness pushes the nth partial a little sharp of n×f. That
// tiny stretch is most of what separates "piano" from "organ", so it is modelled
// here: f(n) = n·f·sqrt(1 + B·n²). Everything else is envelope.
//
// WHY IT CANNOT SOUND SHARP
// Three rules, and they are the whole brief:
//   1. No note starts instantly. Every envelope ramps over ~18ms, so there is
//      no click — a click is a step change, and a step change is broadband.
//   2. Every voice passes a gentle low-pass at ~2.2kHz. The partials that make
//      a piano sound bright and hard are simply not in the output.
//   3. Everything is pentatonic (see SCALE). There is no interval in a major
//      pentatonic scale that can sound dissonant against any other, so notes
//      may overlap freely — a hurried visitor clicking four planets gets a
//      chord, not a clash.
//
// The reverb is a generated impulse response: exponentially-decaying noise,
// built once, ~2.6s. That is what makes single notes read as "resonant" rather
// than as beeps, and it is why the tail of one note is still ringing under the
// next.
// -----------------------------------------------------------------------------

import { useNavigationStore } from '../state/navigationStore'

/** Major pentatonic. Any subset of these sounds consonant in any order. */
export const SCALE = {
  C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.0, A3: 220.0,
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
  C6: 1046.5, D6: 1174.66, E6: 1318.51,
}

/** Partial amplitudes. Steep roll-off — the top of a piano is where hardness
 *  lives, so there is very little of it here. */
const PARTIALS = [1, 0.42, 0.19, 0.09, 0.045, 0.02]
/** String inharmonicity. Small: this is a soft, well-voiced instrument. */
const B = 0.00045

let ctx = null
let master = null
let wet = null
let irBuffer = null

function buildImpulse(ac, seconds = 2.6, decay = 3.1) {
  const n = Math.floor(ac.sampleRate * seconds)
  const buf = ac.createBuffer(2, n, ac.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    for (let i = 0; i < n; i++) {
      // Noise under an exponential decay is the cheapest convincing hall there
      // is, and it costs one allocation for the life of the page.
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay)
    }
  }
  return buf
}

function getContext() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  ctx = new AudioCtx()

  // Output stage: dry + reverb return -> master -> soft compressor -> out.
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -20
  comp.knee.value = 18
  comp.ratio.value = 3
  comp.attack.value = 0.008
  comp.release.value = 0.4

  master = ctx.createGain()
  master.gain.value = 0.85
  master.connect(comp)
  comp.connect(ctx.destination)

  irBuffer = buildImpulse(ctx)
  const convolver = ctx.createConvolver()
  convolver.buffer = irBuffer
  wet = ctx.createGain()
  wet.gain.value = 0.3
  wet.connect(convolver)
  convolver.connect(master)

  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

/** Muting is read from the store at the moment of playing, so a mute takes
 *  effect on the very next note without any subscription plumbing. */
function isMuted() {
  return useNavigationStore.getState().muted
}

/**
 * One struck note.
 * @param {number} freq  fundamental, Hz
 * @param {object} opts
 *   at       seconds from now to strike (default 0)
 *   gain     peak level, 0..1 — 0.1 is a whisper, 0.25 is the loudest used here
 *   hold     decay length in seconds for the fundamental
 */
export function note(freq, { at = 0, gain = 0.16, hold = 2.4 } = {}) {
  const ac = getContext()
  if (!ac || !master || isMuted()) return

  const t = ac.currentTime + at + 0.005

  // One filter and one voice bus per note, torn down when the note ends.
  const voice = ac.createGain()
  voice.gain.value = 1
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 2200
  lp.Q.value = 0.4
  voice.connect(lp)
  lp.connect(master)
  lp.connect(wet)

  let last = null
  PARTIALS.forEach((amp, i) => {
    const n = i + 1
    // Inharmonic stretch — the detail that reads as "string" rather than "tone".
    const f = freq * n * Math.sqrt(1 + B * n * n)
    if (f > 12000) return

    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = f

    const g = ac.createGain()
    // Higher partials die first, exactly as they do on a string. This is what
    // makes the note soften as it rings rather than just getting quieter.
    const life = hold / (1 + i * 0.55)
    g.gain.setValueAtTime(0.0001, t)
    // ~18ms attack: soft enough that there is no click, fast enough to still
    // read as a key being struck rather than a pad swelling.
    g.gain.exponentialRampToValueAtTime(Math.max(gain * amp, 0.00012), t + 0.018)
    g.gain.exponentialRampToValueAtTime(0.00001, t + life)

    osc.connect(g)
    g.connect(voice)
    osc.start(t)
    osc.stop(t + life + 0.05)
    last = osc
  })

  // The longest partial owns the teardown, so nothing lingers in the graph.
  if (last) {
    last.onended = () => {
      voice.disconnect()
      lp.disconnect()
    }
  }
}

/** A rolled chord — notes spaced like fingers landing, not a block. */
export function phrase(freqs, { spacing = 0.09, gain = 0.15, hold = 2.8, at = 0 } = {}) {
  freqs.forEach((f, i) => note(f, { at: at + i * spacing, gain, hold }))
}

// --- The cues ---------------------------------------------------------------

/** A planet. Very light — this fires on every selection, so it has to be the
 *  quietest thing in the set or it becomes noise. */
export function playBody(index = 0) {
  const ladder = [SCALE.E4, SCALE.G4, SCALE.A4, SCALE.D4, SCALE.C5]
  note(ladder[index % ladder.length], { gain: 0.11, hold: 2.2 })
}

/** The warp into the CV: an open ascending figure, low root underneath. */
export function playWarp() {
  note(SCALE.C3, { gain: 0.09, hold: 5 })
  phrase([SCALE.C4, SCALE.E4, SCALE.G4, SCALE.C5], { spacing: 0.105, gain: 0.15, hold: 3.4 })
  note(SCALE.E5, { at: 0.42, gain: 0.1, hold: 3.8 })
}

/** Back to orbit: the same figure, falling. */
export function playReturn() {
  phrase([SCALE.G4, SCALE.E4, SCALE.C4], { spacing: 0.1, gain: 0.12, hold: 3 })
}

/** A panel opening — one note, barely there. */
export function playOpen() {
  note(SCALE.D4, { gain: 0.09, hold: 1.8 })
}

/** A panel closing. */
export function playClose() {
  note(SCALE.A3, { gain: 0.08, hold: 1.6 })
}

/** The emblem beside the name.
 *
 *  A rising open fourth resolving to the octave — the shortest figure that
 *  sounds like a signature rather than a notification. Softer than every other
 *  cue in the set, because this one is discovered by curiosity rather than
 *  aimed at, and it should reward a poke without startling anyone. */
export function playEmblem() {
  note(SCALE.D4, { gain: 0.075, hold: 2.6 })
  note(SCALE.G4, { at: 0.11, gain: 0.085, hold: 2.9 })
  note(SCALE.D5, { at: 0.22, gain: 0.07, hold: 3.4 })
  note(SCALE.A4, { at: 0.34, gain: 0.05, hold: 3.6 })
}

/** Catching the rocket.
 *
 *  The only cue in the set with a RHYTHM rather than an even spacing: two quick
 *  notes, a rest, then a rising answer. It is a small reward for a difficult
 *  click — the rocket is moving, and hitting it deserves to sound like landing
 *  something. Still pentatonic, so it lands consonantly on top of whatever else
 *  happens to be ringing. */
export function playRocket() {
  note(SCALE.G4, { gain: 0.085, hold: 2.2 })
  note(SCALE.C5, { at: 0.085, gain: 0.1, hold: 2.4 })
  note(SCALE.E5, { at: 0.17, gain: 0.095, hold: 2.6 })
  note(SCALE.G5, { at: 0.38, gain: 0.085, hold: 3 })
  note(SCALE.C6, { at: 0.47, gain: 0.07, hold: 3.4 })
  note(SCALE.A5, { at: 0.62, gain: 0.055, hold: 3.6 })
  note(SCALE.C3, { gain: 0.05, hold: 4 })
}

/** Leaving a body's panel for the system again.
 *
 *  Deliberately the quietest thing here. It marks a step backwards out of a
 *  place, so it falls rather than rises, and it is two notes rather than a
 *  phrase — a door closing softly behind you, not an announcement. */
export function playBack() {
  note(SCALE.A4, { gain: 0.065, hold: 2.2 })
  note(SCALE.E4, { at: 0.1, gain: 0.075, hold: 2.8 })
}

/** The certificate on the station.
 *
 *  Deliberately the only cue in the set that is a CHORD struck together rather
 *  than a rolled figure, and the only one voiced this high — so it is
 *  identifiable as "that object" without being louder than anything else. An
 *  open fifth with the octave above it: the most consonant shape there is, which
 *  is what lets it ring out over whatever else is still decaying. */
export function playCertificate() {
  note(SCALE.C5, { gain: 0.1, hold: 3.4 })
  note(SCALE.G5, { gain: 0.075, hold: 3.6 })
  note(SCALE.A5, { at: 0.07, gain: 0.055, hold: 3.8 })
  note(SCALE.C4, { gain: 0.06, hold: 4.2 })
}

/** Unmuting should say so, so the control proves itself. Called by the button
 *  AFTER the store flag has been cleared, or it would mute its own confirmation. */
export function playUnmute() {
  note(SCALE.G4, { gain: 0.1, hold: 2 })
}
