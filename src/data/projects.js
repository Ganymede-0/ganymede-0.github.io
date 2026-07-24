// -----------------------------------------------------------------------------
// Single source of truth for every celestial body in the system.
// Edit copy, links, and metrics here — nothing else in the codebase should
// need to change when you update a project.
//
// category: 'planet'  -> a project, rendered as an orbiting planet
//           'station'  -> professional experience, rendered as a satellite
//
// orbitRadius / orbitTilt / orbitSpeed / startAngle control where the body
// sits and how fast it moves in OrbitSystem.jsx. Distance from the core
// currently reads left-to-right as roughly chronological (closest = most
// recent). Reorder freely — it's just data.
// -----------------------------------------------------------------------------

export const CATEGORY = {
  PLANET: 'planet',
  STATION: 'station',
};

export const projects = [
  {
    id: 'raha',
    category: CATEGORY.PLANET,
    missionCode: 'MSN-01',
    name: 'Raha',
    tagline: 'Automated 3D medical scan analysis platform',
    orbitRadius: 7.5,
    orbitTilt: 0.09,
    orbitSpeed: 0.055,
    startAngle: 0.6,
    size: 1.05,
    color: '#6fe7dc',
    emissive: '#1c7f78',
    pattern: 'bands',
    surface: 'medical', // bioluminescent cellular tissue + sweeping scan laser

    summary:
      'A full-stack pipeline that takes a raw micro-CT scan and returns a validated, ' +
      'reproducible diagnosis — built for a graduation research project on periodontitis.',
    problem:
      'Manually localizing and segmenting anatomical structures in 3D volumetric scans ' +
      'is slow, and inter-observer variability makes results hard to trust for research use.',
    approach:
      'A three-phase deep learning pipeline: an anatomical localizer isolates the region ' +
      'of interest, six 3D segmentation architectures (3D U-Net, V-Net, Attention U-Net, and ' +
      'nnU-Net variants) are trained and compared on the localized crops, and a hybrid ' +
      'diagnosis stage runs a leakage-free leave-one-out cross-validation for a held-out ' +
      'blind test.',
    stack: ['PyTorch', 'MONAI', 'SimpleITK', '3D U-Net / V-Net / Attention U-Net', 'Docker', 'VS Code'],
    metrics: [
      { label: 'Dice score', value: '0.95+' },
      { label: 'Pipeline phases', value: '3' },
      { label: 'Segmentation models compared', value: '6' },
    ],
    competencies: ['Computer vision', '3D volumetric imaging', 'Medical imaging', 'Reproducible ML environments'],
    links: [
      // TODO: replace with your real repo URL once it's live
      { label: 'Repository', url: 'https://github.com/ganymede-0/raha' },
    ],
  },

  {
    id: 'bayan',
    category: CATEGORY.PLANET,
    missionCode: 'MSN-02',
    name: 'Bayan',
    tagline: 'Industrial predictive maintenance, forecasting + language',
    orbitRadius: 10.5,
    orbitTilt: -0.05,
    orbitSpeed: 0.04,
    startAngle: 2.4,
    size: 1.2,
    color: '#d98e4a',
    emissive: '#8a5c30',
    pattern: 'storm',
    surface: 'industrial', // forged metal, amber grid, molten fracture seams

    summary:
      'An industrial predictive maintenance pipeline that forecasts equipment failure and ' +
      'explains it in plain language for the people who have to act on it.',
    problem:
      'Time-series failure forecasts are only useful to a maintenance crew if someone can ' +
      'quickly understand what the model is actually flagging and why.',
    approach:
      'A time-series transformer forecasts degradation and failure risk from sensor data, ' +
      'feeding a fine-tuned LLM that turns the forecast into a clear, actionable maintenance ' +
      'summary — scored against reference explanations for factual consistency.',
    stack: ['Time-series transformers', 'Fine-tuned LLM (7B)', 'PyTorch', 'Docker', 'VS Code'],
    metrics: [
      { label: 'BERTScore (explanations)', value: '0.92' },
    ],
    competencies: ['Time-series forecasting', 'LLM fine-tuning', 'Applied NLP', 'Local ML environments'],
    links: [
      { label: 'Repository', url: 'https://github.com/ganymede-0/bayan' },
    ],
  },

  {
    id: 'sharqiyah',
    category: CATEGORY.PLANET,
    missionCode: 'MSN-03',
    name: 'Sharqiyah',
    tagline: 'Real estate market analytics, from raw listings to price signal',
    orbitRadius: 13.5,
    orbitTilt: 0.03,
    orbitSpeed: 0.03,
    startAngle: 4.4,
    size: 0.95,
    color: '#c9a45c',
    emissive: '#6b562a',
    pattern: 'grid',
    surface: 'data', // topographic contours + holographic data matrix

    summary:
      'A regression-driven analytics dashboard that tracks and predicts real estate prices ' +
      'across the Eastern Province, built for people who need an answer, not a notebook.',
    problem:
      'Real estate pricing data in the region is scattered and noisy — turning it into a ' +
      'trustworthy, explorable price signal takes more than a spreadsheet.',
    approach:
      'A CatBoost regression model is trained on cleaned listing and market data, then ' +
      'wrapped in a Streamlit dashboard so non-technical stakeholders can explore price ' +
      'drivers and forecasts directly.',
    stack: ['CatBoost', 'Streamlit', 'Python', 'Docker'],
    metrics: [
      { label: 'R²', value: '0.794' },
    ],
    competencies: ['Tabular ML', 'Regression modeling', 'Data dashboards', 'Applied analytics'],
    links: [
      { label: 'Repository', url: 'https://github.com/ganymede-0/sharqiyah-real-estate-ai' },
    ],
  },

  {
    id: 'leap-networks',
    category: CATEGORY.STATION,
    missionCode: 'OPS-00',
    name: 'Leap Networks Arabia',
    tagline: 'COOP training — client tracking networks & video systems',
    orbitRadius: 4.6,
    orbitTilt: 0.16,
    orbitSpeed: 0.09,
    startAngle: 1.1,
    size: 0.5,
    color: '#e4572e',
    emissive: '#7a2c17',
    pattern: 'station',

    summary:
      'Cooperative training placement working with external clients\u2019 tracking networks ' +
      'and video materials in a live operational environment.',
    // TODO: this is the thinnest section right now — expand with 2-3 concrete
    // things you actually did day to day (what you touched, what shipped,
    // what you'd tell a hiring manager if they asked "so what did you do there?").
    problem:
      'Client-facing tracking networks and video infrastructure need to stay reliable and ' +
      'observable in production, not just in a lab.',
    approach:
      'Worked directly with external clients\u2019 tracking networks and video materials, ' +
      'bridging day-to-day operational needs with an engineering perspective.',
    stack: ['Client tracking networks', 'Video systems', 'VS Code'],
    metrics: [],
    competencies: ['Applied field engineering', 'Client-facing technical work'],
    links: [],
  },
];

export const getProjectById = (id) => projects.find((p) => p.id === id);
