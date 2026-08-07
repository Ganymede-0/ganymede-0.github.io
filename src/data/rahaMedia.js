// -----------------------------------------------------------------------------
// The Raha walkthrough — the platform's own screens, in the order a person
// actually meets them.
//
// The ordering is the argument. Anyone can post a grid of screenshots; what
// makes this read as a product rather than a folder is that it runs as one
// continuous session — arrive on the public site, register, land in the
// workspace, run a scan, read what came back, question it, then step up into
// the admin console and out again. Chapter breaks fall where the user's ROLE or
// INTENT changes, not where the screenshots happened to be captured.
//
// Assets come from scripts/build-media.mjs. The `id` of each shot is the slug
// that script writes, so `full/<id>.webp` and `thumb/<id>.webp` both resolve.
// Adding a screenshot means re-running that script and adding an entry here.
//
// Captions say what the screen DEMONSTRATES, not what it is. "Analysis #35 —
// multiplanar view" is a filename; "three orthogonal planes and a 3D
// reconstruction driven by one crosshair" is why the shot is in the set.
// -----------------------------------------------------------------------------

const BASE = `${import.meta.env.BASE_URL}media/raha`

export const rahaVideo = {
  type: 'video',
  id: 'demo',
  src: `${BASE}/raha-demo.mp4`,
  poster: `${BASE}/poster.webp`,
  title: 'Platform demo',
  caption:
    'A recorded run through the deployed platform — upload, automated analysis, and the ' +
    'returned measurements, end to end.',
}

export const rahaChapters = [
  {
    id: 'access',
    index: '01',
    title: 'Access',
    blurb:
      'The public face and the way in. Registration is scoped to institutional identity, ' +
      'because every scan stored behind it belongs to a named researcher.',
    shots: [
      { id: 'home', caption: 'The public landing page. The platform states what it does before asking for anything.' },
      { id: 'about-top', caption: 'Project context — the research programme the platform was built to serve.' },
      { id: 'contact', caption: 'A support route that exists before sign-up, not only after it.' },
      { id: 'manual-top', caption: 'The full user manual is public. Nothing about how the system works sits behind the login.' },
      { id: 'manual-quickstart', caption: 'Quick Start: the shortest path from no account to a first result.' },
      { id: 'manual-workflows1', caption: 'Detailed workflows — account registration and login, written out step by step.' },
      { id: 'manual-workflows2', caption: 'Password reset, upload, and result review documented to the same level.' },
      { id: 'manual-support', caption: 'Admin notes and troubleshooting, including the failure cases worth naming.' },
      { id: 'signup-top', caption: 'Registration opens with title, name, and institution — identity before credentials.' },
      { id: 'signup-bottom', caption: 'Role, institutional email, and an enforced password policy complete the account.' },
      { id: 'login', caption: 'Sign-in, with an optional persisted session.' },
      { id: 'forgot-form', caption: 'Password recovery requests a reset against the registered address.' },
      { id: 'forgot-sent', caption: 'Confirmation state — the system says what it sent and where, rather than failing silently.' },
    ],
  },
  {
    id: 'workspace',
    index: '02',
    title: 'The workspace',
    blurb:
      'What a researcher lands in. Every scan, result, and export in the session below ' +
      'is scoped to this account.',
    shots: [
      { id: 'res-home', caption: 'The researcher workspace: analyse, review, or learn — three routes, no clutter.' },
      { id: 'res-profile-overview', caption: 'The account at a glance, including the running total of scans processed.' },
      { id: 'res-profile-edit-top', caption: 'Title and full name are separate fields, so "Dr" renders correctly everywhere it appears.' },
      { id: 'res-profile-edit-bottom', caption: 'Credential changes and account deletion sit in the same form, clearly separated by weight.' },
    ],
  },
  {
    id: 'analysis',
    index: '03',
    title: 'Running an analysis',
    blurb:
      'The step the whole pipeline exists for. Two modes: hand the platform a raw volume ' +
      'and let it segment, or supply an existing label and skip straight to measurement.',
    shots: [
      { id: 'res-analyze-top', caption: 'Upload a volumetric scan. Volume-Only runs the full pipeline; Volume + Label uses a prepared segmentation.' },
      { id: 'res-analyze-bottom', caption: 'The stages are named up front — localizer, nnU-Net, measurement, classifier — so the run is legible while it works.' },
    ],
  },
  {
    id: 'scan',
    index: '04',
    title: 'Reading the scan',
    blurb:
      'The result is a 3D volume, so the viewer has to be one. A first-run tutorial teaches ' +
      'the three gestures before handing over the controls.',
    shots: [
      { id: 'tutorial1', caption: 'First run, gesture one: drag the crosshair to slice through the volume.' },
      { id: 'tutorial2', caption: 'Gesture two: press and drag to rotate the reconstruction.' },
      { id: 'tutorial3', caption: 'Gesture three: pinch to zoom while keeping the region centred.' },
      { id: 'res-scan1', caption: 'Three orthogonal planes and a 3D reconstruction, all driven by one crosshair. Bone and tooth are separately labelled.' },
      { id: 'res-scan2', caption: 'The segmentation overlay has an opacity control and can be hidden outright — the original scan is always recoverable.' },
      { id: 'res-metrics1', caption: 'BV/TV against its reference bands, beside the per-slice profile along the axial axis.' },
      { id: 'res-metrics2', caption: 'Trabecular thickness and separation, each shown against the configured healthy range rather than as a bare number.' },
    ],
  },
  {
    id: 'evidence',
    index: '05',
    title: 'Evidence and doubt',
    blurb:
      'Two things a research tool has to support and most do not: comparing a case against ' +
      'itself over time, and telling the system it is wrong.',
    shots: [
      { id: 'res-compare1', caption: 'Baseline against post-treatment, selected from the same account’s history.' },
      { id: 'res-compare2', caption: 'Both volumes side by side with their measurements — the comparison is evidence, not a verdict.' },
      { id: 'res-results', caption: 'The result library. BV, TV and BV/TV are on the card, so triage happens without opening anything.' },
      { id: 'res-report1', caption: 'Report an Issue is attached to the specific analysis, not to a generic contact form.' },
      { id: 'res-report2', caption: 'Typed issues — segmentation, calculation, UI — so reports arrive already triaged.' },
    ],
  },
  {
    id: 'documentation',
    index: '06',
    title: 'Teaching the tool',
    blurb:
      'The platform ships its own training library. Every workflow has a recorded ' +
      'walkthrough and a written procedure beside it.',
    shots: [
      { id: 'res-guides-top', caption: 'The five-step overview: upload, name, run, review, report.' },
      { id: 'res-guides-bottom', caption: 'FAQ covering formats, model accuracy, and data handling.' },
      { id: 'res-guides1', caption: 'The training library proper — video, written steps, and recording guidance per workflow.' },
      { id: 'res-guides2', caption: 'Volume-only analysis, with the pipeline stages narrated in order.' },
      { id: 'res-guides3', caption: 'Analysing a volume against an existing label.' },
      { id: 'res-guides4', caption: 'Reading the scan viewer and its measurements.' },
      { id: 'res-guides5', caption: 'Interpreting the gauges and the Z-axis bone profile.' },
      { id: 'res-guides6', caption: 'Comparing baseline and treatment analyses.' },
      { id: 'res-guides7', caption: 'Exporting research CSV and PDF reports.' },
      { id: 'res-guides8', caption: 'Managing results and writing an issue report the support team can act on.' },
      { id: 'res-manual-top', caption: 'The same manual as the public site, now inside the authenticated shell.' },
      { id: 'res-manual-workflows1', caption: 'Registration and login procedures.' },
      { id: 'res-manual-workflows2', caption: 'Password reset, upload, and analysis procedures.' },
      { id: 'res-manual-review', caption: 'Result review and the profile and support sections.' },
      { id: 'res-manual-support', caption: 'Troubleshooting, expandable per symptom.' },
      { id: 'res-contact', caption: 'Support reachable without leaving the workspace.' },
    ],
  },
  {
    id: 'admin',
    index: '07',
    title: 'The admin console',
    blurb:
      'A second role with a different job: watch the platform rather than use it. ' +
      'Reported issues land here as work, not as email.',
    shots: [
      { id: 'admin-home', caption: 'The admin landing view — platform activity rather than personal scans.' },
      { id: 'admin-users', caption: 'Registered accounts, reviewable and manageable.' },
      { id: 'admin-issues', caption: 'Researcher-reported issues arrive typed and attributed to a specific analysis.' },
      { id: 'admin-logs', caption: 'Audited sign-ins and tracked system events.' },
      { id: 'admin-profile', caption: 'The admin’s own account, on the same profile component as the researcher’s.' },
      { id: 'admin-manual-top', caption: 'The manual again, in the admin shell — one document, three roles.' },
      { id: 'admin-manual-workflows1', caption: 'Shared workflow documentation.' },
      { id: 'admin-manual-workflows2', caption: 'Analysis and review procedures.' },
      { id: 'admin-manual-support', caption: 'The admin notes section, which describes exactly this console.' },
    ],
  },
  {
    id: 'craft',
    index: '08',
    title: 'Craft and exit',
    blurb:
      'A full dark theme across every view, and a sign-out that confirms rather than ' +
      'simply dropping the session.',
    shots: [
      { id: 'welcom-sarah-dark', caption: 'The workspace in dark theme — a real second palette, not an inverted filter.' },
      { id: 'dark-analyze', caption: 'Upload and mode selection hold up in dark, including the drop zones.' },
      { id: 'dark-results', caption: 'The scan viewer in dark, where the segmentation overlay reads at its best.' },
      { id: 'logout-researcher', caption: 'Signing out is confirmed, not instant — a misclick does not end the session.' },
      { id: 'logout-admin', caption: 'The same confirmation on the admin side.' },
    ],
  },
]

// The recording gets its own chapter rather than being filed under Access. It
// is not a step in the journey — it is the whole journey, compressed — so it
// sits ahead of the sequence as its own thing.
export const rahaFilmChapter = {
  id: 'film',
  index: '00',
  title: 'The film',
  blurb: 'The platform running, start to finish, before the stills break it down screen by screen.',
  shots: [],
}

// What the chapter rail renders: the film, then the eight chapters in order.
export const rahaRail = [rahaFilmChapter, ...rahaChapters]

// Flattened running order, with chapter membership carried on each entry. The
// viewer steps through THIS array, so arrow keys cross chapter boundaries the
// way a reader expects and the counter reads "12 / 62" across the whole set
// rather than restarting per chapter.
export const rahaReel = [
  { ...rahaVideo, chapterId: rahaFilmChapter.id, chapterTitle: rahaFilmChapter.title },
  ...rahaChapters.flatMap((chapter) =>
    chapter.shots.map((shot) => ({
      type: 'image',
      ...shot,
      full: `${BASE}/full/${shot.id}.webp`,
      thumb: `${BASE}/thumb/${shot.id}.webp`,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
    }))
  ),
]

export const rahaMedia = {
  projectId: 'raha',
  video: rahaVideo,
  chapters: rahaChapters,
  rail: rahaRail,
  reel: rahaReel,
  shotCount: rahaReel.filter((item) => item.type === 'image').length,
}

export const getMediaForProject = (id) => (id === rahaMedia.projectId ? rahaMedia : null)
