// -----------------------------------------------------------------------------
// The approach sequence — the narrative a visitor reads on the way in.
//
// EDITORIAL RULE: this is not the résumé. The full CV lives in cv.js and stays
// one click away at all times. These five beats exist to answer, in under a
// minute, the only three questions a recruiter opens a portfolio with: who is
// this, what can she actually do, and is there proof.
//
// Every beat therefore leads with a plain-language sentence and only then
// attaches the metric. A hiring manager and a technical director should both be
// able to read the same line and each get what they came for — the first
// understands the outcome, the second recognises the number behind it.
//
// Keep this to five. The scroll length is the visitor's patience budget, and
// each added chapter spends more of it before they reach the projects.
// -----------------------------------------------------------------------------

export const chapters = [
  {
    id: 'identity',
    code: '00',
    kicker: 'Approach sequence',
    title: 'Sarah Altheeb',
    lead: 'Artificial Intelligence Engineer',
    body:
      'I build systems that turn raw industrial sensor and imaging data into decisions ' +
      'people can act on — and I take them all the way into production, not just to a ' +
      'working notebook.',
    meta: 'Al Khobar · Eastern Province, Saudi Arabia',
  },

  {
    id: 'practice',
    code: '01',
    kicker: 'What I do',
    title: 'From raw signal to a decision someone can defend',
    body:
      'Most machine learning never reaches the field, because the gap is rarely the model — ' +
      'it is the data pipeline before it and the deployment after it. I work across that ' +
      'whole path: ingesting and validating operational data, developing models for anomaly ' +
      'detection and equipment condition monitoring, and deploying them on-premise inside ' +
      'live industrial environments.',
    tags: ['Computer Vision', 'Industrial AI', 'MLOps', 'Predictive Maintenance'],
  },

  {
    id: 'proof',
    code: '02',
    kicker: 'Evidence',
    title: 'Three systems, measured',
    body:
      'Each of these is a complete engineered system with a benchmarked result — not a ' +
      'coursework exercise. You can open any of them at the end of this sequence.',
    stats: [
      { value: '0.95+', label: 'Dice score', note: 'Volumetric segmentation across 90+ GB of 3D scan data' },
      { value: 'Top 15%', label: 'C-MAPSS benchmark', note: 'Remaining Useful Life estimation vs. published methods' },
      { value: '0.794', label: 'Model R²', note: 'Five years of Eastern Province market data' },
    ],
  },

  {
    id: 'practice-field',
    code: '03',
    kicker: 'In the field',
    title: 'Delivered into a production AI platform',
    body:
      'As an AI Engineer at Leap Networks Arabia I built the computer-vision ingestion ' +
      'pipeline behind safety-monitoring models used by Tier-1 industrial clients, and ' +
      'supported on-premise rollout of the Leap AI Engine — provisioning Linux environments ' +
      'and configuring containers so inference runs inside client infrastructure rather ' +
      'than a vendor cloud.',
    meta: 'B.Sc. Artificial Intelligence · GPA 4.61 / 5.00 · Imam Abdulrahman Bin Faisal University',
  },

  {
    id: 'arrival',
    code: '04',
    kicker: 'Arrival',
    title: 'The system ahead',
    body:
      'Each body in orbit is one of these projects. Select any one to read how it was ' +
      'built, what it was measured against, and where the code lives.',
    isArrival: true,
  },
]
