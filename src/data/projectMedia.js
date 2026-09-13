import { rahaMedia } from './rahaMedia'

// -----------------------------------------------------------------------------
// EVIDENCE, PER PROJECT.
//
// Raha already had a walkthrough; this is the registry that gives every other
// body the same machinery instead of a second, parallel one. Each entry is the
// contract MediaDossier and MissionPanel already read:
//
//   hero      the one image a visitor sees before deciding to look further
//   rail      chapters, in order, for the walkthrough's top rail
//   reel      every item flattened, so the arrow keys cross chapters
//   teaser    which reel ids the mission panel shows as thumbnails
//
// WHERE THESE IMAGES CAME FROM
// The figures are the ones published in each repository's README — the RUL
// convergence curve and the ablation heatmap from Bayan, the four dashboard
// captures from Sharqiyah — downloaded, re-encoded as WebP at two sizes and
// committed. Hot-linking GitHub's attachment CDN would have put an
// uncacheable, un-resizable, third-party request on the critical path of a
// panel, for assets that change roughly never.
//
// The Leap certificate is the actual PDF in docs/, rendered to an image.
// -----------------------------------------------------------------------------

const BASE = import.meta.env.BASE_URL

/** Build the flat reel and rail from a list of chapters. */
function assemble(projectId, chapters, extra = {}) {
  const reel = chapters.flatMap((chapter) =>
    chapter.shots.map((shot) => ({
      type: 'image',
      ...shot,
      full: `${BASE}${shot.path}.webp`,
      thumb: `${BASE}${shot.path}-thumb.webp`,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
    }))
  )
  return {
    projectId,
    chapters,
    rail: chapters,
    reel,
    shotCount: reel.length,
    ...extra,
  }
}

// --- Bayan --------------------------------------------------------------------
const bayanChapters = [
  {
    id: 'results',
    index: '01',
    title: 'Empirical results',
    blurb:
      'The two figures the work is judged on: how closely the encoder tracks true ' +
      'remaining life at end of life, and whether the fine-tuning was necessary.',
    shots: [
      {
        id: 'bayan-rul',
        path: 'media/bayan/rul-curve',
        caption:
          'Thirty-cycle EMA degradation trajectory for one engine. The transformer converges ' +
          'with true RUL through the end-of-life boundary — the phase where a late prediction ' +
          'is the expensive one.',
      },
      {
        id: 'bayan-ablation',
        path: 'media/bayan/ablation',
        caption:
          'Ablation study. Zero-shot models cannot format an industrial report at all ' +
          '(ROUGE-L 0.171); swapping the transformer encoder for an LSTM costs accuracy ' +
          'across every metric. Both halves of the architecture are load-bearing.',
      },
    ],
  },
]

const bayan = assemble('bayan', bayanChapters, {
  hero: {
    kind: 'image',
    poster: `${BASE}media/bayan/rul-curve.webp`,
    label: 'RUL convergence',
  },
  teaser: ['bayan-rul', 'bayan-ablation'],
  openLabel: 'Open the results',
  countLabel: 'figures',
})

// --- Sharqiyah ----------------------------------------------------------------
const sharqiyahChapters = [
  {
    id: 'market',
    index: '01',
    title: 'Market analysis',
    blurb:
      'The historical half of the dashboard: a million-plus rental deals from 2019 to 2024, ' +
      'filterable by city, property type and year.',
    shots: [
      {
        id: 'sq-eda-market',
        path: 'media/sharqiyah/eda-market',
        caption:
          'The analysis view. Volume concentrates on Dammam and Al Khobar, and the pricing ' +
          'hierarchy between property types holds across the whole period.',
      },
      {
        id: 'sq-eda-trends',
        path: 'media/sharqiyah/eda-trends',
        caption:
          'Trend breakdowns over the same filters — including the post-pandemic recovery, ' +
          'which is visible in the transaction volume rather than inferred.',
      },
    ],
  },
  {
    id: 'estimator',
    index: '02',
    title: 'AI price estimator',
    blurb:
      'The deployed model as a working valuation tool: enter a property, get a figure, then ' +
      'project it forward past the data the model was trained on.',
    shots: [
      {
        id: 'sq-estimator',
        path: 'media/sharqiyah/estimator',
        caption:
          'Property parameters in, a CatBoost valuation out. The model is served through a ' +
          'serialised ColumnTransformer, so user input is encoded exactly as training data was.',
      },
      {
        id: 'sq-forecast',
        path: 'media/sharqiyah/forecast',
        caption:
          'The Hybrid Forecasting Engine. Gradient-boosted trees cannot extrapolate past their ' +
          'training horizon, so a user-controlled CAGR extends the ML baseline into future ' +
          'years — the model does what it is good at, and the arithmetic does the rest.',
      },
    ],
  },
]

const sharqiyah = assemble('sharqiyah', sharqiyahChapters, {
  hero: {
    kind: 'image',
    poster: `${BASE}media/sharqiyah/estimator.webp`,
    label: 'Live dashboard',
  },
  teaser: ['sq-eda-market', 'sq-eda-trends', 'sq-estimator', 'sq-forecast'],
  openLabel: 'Open the dashboard tour',
  countLabel: 'screens',
})

// --- Leap Networks ------------------------------------------------------------
// No media entry. The certificate is the evidence for this body, and it is
// rendered by CertificateCard directly in the panel at a size it can be read
// at — listing it here as well put the same document on screen twice.

// --- Raha ---------------------------------------------------------------------
// Wrapped rather than rewritten: its chapters and reel already exist, and this
// only adds the presentation fields the panel now reads from data instead of
// having them hard-coded inside the component.
const raha = {
  ...rahaMedia,
  hero: {
    kind: 'video',
    poster: rahaMedia.video.poster,
    label: 'Platform demo',
  },
  teaser: ['res-scan1', 'res-metrics1', 'res-analyze-top', 'res-results'],
  openLabel: 'Open the walkthrough',
  countLabel: 'screens',
}

const REGISTRY = {
  raha,
  bayan,
  sharqiyah,
}

export const getMediaForProject = (id) => REGISTRY[id] ?? null
