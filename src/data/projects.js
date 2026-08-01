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
    tagline: 'Volumetric imaging pipeline · 90+ GB processed to validated metrics',
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
      'A full-stack platform that ingests raw volumetric scanner output and returns ' +
      'validated, reproducible metrics — 90+ GB of high-dimensional 3D data moved through ' +
      'an automated pipeline with no manual annotation step.',
    problem:
      'Localizing and segmenting structures inside 3D volumetric data is slow when done by ' +
      'hand, and inter-observer variability makes the output difficult to trust or audit. ' +
      'At scan volumes above a few gigabytes, manual review stops being viable at all.',
    approach:
      'A multi-stage 3D deep learning pipeline. An anatomical localizer resolves the target ' +
      'region to within roughly one voxel, feeding localized crops to a segmentation stage ' +
      'benchmarked across six architectures (3D U-Net, V-Net, Attention U-Net and nnU-Net ' +
      'variants). A final stage runs leakage-free leave-one-out cross-validation against a ' +
      'held-out blind test, and MLOps packaging carries the trained components into a cloud ' +
      'web interface for delivery.',
    stack: ['PyTorch', 'MONAI', 'nnU-Net', 'FastAPI', 'PostgreSQL', 'Docker'],
    metrics: [
      { label: 'Dice score', value: '0.95+' },
      { label: 'Volumetric data processed', value: '90+ GB' },
      { label: 'Localizer error', value: '~1 voxel' },
    ],
    competencies: [
      'Computer vision',
      '3D volumetric analysis',
      'Automated data pipelines',
      'MLOps & deployment packaging',
    ],
    // No public repository for Raha.
    links: [],
  },

  {
    id: 'bayan',
    category: CATEGORY.PLANET,
    missionCode: 'MSN-02',
    name: 'Bayan',
    tagline: 'Predictive maintenance · RUL estimation in the top 15% on C-MAPSS',
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
      'An equipment condition monitoring system that estimates Remaining Useful Life from ' +
      'sensor telemetry and issues severity-classified maintenance advisories — engineered ' +
      'for the asset reliability problem that defines upstream oil & gas operations.',
    problem:
      'A degradation forecast only changes an outcome if the crew acting on it understands ' +
      'what was flagged and how urgent it is. Raw RUL curves and anomaly scores do not ' +
      'survive the handoff from data science to the maintenance planner.',
    approach:
      'A Transformer-based encoder models degradation across multivariate sensor streams to ' +
      'estimate Remaining Useful Life, benchmarked into the top 15% of published deep ' +
      'learning methods on C-MAPSS. Structured anomaly features then drive a fine-tuned ' +
      '7B-parameter LLM that generates severity-classified, actionable advisories, validated ' +
      'at 0.92 BERTScore against expert-written ground-truth reports.',
    stack: ['PyTorch', 'Hugging Face Transformers', 'LLM fine-tuning (7B)', 'Docker'],
    metrics: [
      { label: 'C-MAPSS ranking', value: 'Top 15%' },
      { label: 'Advisory BERTScore', value: '0.92' },
    ],
    competencies: [
      'Predictive maintenance',
      'Time-series & RUL modelling',
      'Anomaly detection',
      'LLM fine-tuning',
    ],
    links: [
      { label: 'Repository', url: 'https://github.com/Ganymede-0/Bayan-Predictive-Maintenance-AI' },
    ],
  },

  {
    id: 'sharqiyah',
    category: CATEGORY.PLANET,
    missionCode: 'MSN-03',
    name: 'Sharqiyah',
    tagline: 'Eastern Province market analytics · R² = 0.794 over 5+ years of data',
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
      'A regression and forecasting stack turning five years of noisy Eastern Province ' +
      'transaction data into a defensible price signal, delivered as a dashboard that ' +
      'supports business decisions directly rather than as a notebook.',
    problem:
      'Regional transaction data is fragmented and heavily skewed by outliers, and ' +
      'tree-based models — the strongest performers on this kind of tabular data — cannot ' +
      'extrapolate beyond their training window, which is exactly what a forecast requires.',
    approach:
      'A CatBoost regression model trained on cleaned transaction data with ' +
      'log-transformation and processing components engineered to absorb extreme price ' +
      'outliers, reaching R² = 0.794. A Hybrid Forecasting Engine then composes that ML ' +
      'baseline with dynamic CAGR mathematics, deliberately covering the temporal ' +
      'extrapolation gap that tree ensembles cannot span on their own.',
    stack: ['CatBoost', 'Scikit-learn', 'Streamlit', 'Pandas', 'Plotly'],
    metrics: [
      { label: 'Model R²', value: '0.794' },
      { label: 'Market history modelled', value: '5+ yrs' },
    ],
    competencies: [
      'Tabular ML & regression',
      'Time-series extrapolation',
      'Analytics dashboards',
      'Decision support',
    ],
    links: [
      { label: 'Repository', url: 'https://github.com/Ganymede-0/sharqiyah-rentals-dashboard' },
    ],
  },

  {
    id: 'leap-networks',
    category: CATEGORY.STATION,
    missionCode: 'OPS-00',
    name: 'Leap Networks Arabia',
    tagline: 'AI Engineer COOP · safety-monitoring pipelines & on-premise AI deployment',
    orbitRadius: 4.6,
    orbitTilt: 0.16,
    orbitSpeed: 0.09,
    startAngle: 1.1,
    size: 0.5,
    color: '#e4572e',
    emissive: '#7a2c17',
    pattern: 'station',

    summary:
      'Cooperative engineering placement delivering into Leap\u2019s production AI platform: ' +
      'computer-vision data pipelines for safety monitoring, feature work across the ERP ' +
      'and RTLS/SSMS systems, and on-premise deployment of the Leap AI Engine for Tier-1 ' +
      'industrial clients.',
    problem:
      'Industrial safety and equipment-monitoring models are only as good as the footage ' +
      'they are trained on and the environment they run in. Raw CCTV is unusable without ' +
      'filtering, and clients in this sector require inference to run on their own ' +
      'infrastructure rather than in a vendor cloud.',
    approach:
      'Built a Python and OpenCV pipeline applying algorithmic filters to raw CCTV footage, ' +
      'extracting 800+ clean frames to train the safety-monitoring models used by industrial ' +
      'clients, with exploratory data analysis validating dataset quality before training. ' +
      'Supported on-premise rollout of the Leap AI Engine by provisioning native Linux ' +
      'environments and configuring Docker containers for real-time equipment monitoring ' +
      'and anomaly detection, and integrated custom features into the Django/Next.js ERP ' +
      'and RTLS/SSMS AI systems to automate operational workflows.',
    stack: ['Python', 'OpenCV', 'Docker', 'Linux', 'Django', 'Next.js'],
    metrics: [
      { label: 'Training frames extracted', value: '800+' },
      { label: 'Deployment target', value: 'On-prem' },
    ],
    competencies: [
      'Computer-vision data pipelines',
      'On-premise AI deployment',
      'Industrial safety systems',
      'Full-stack integration',
    ],
    links: [],
  },
];

export const getProjectById = (id) => projects.find((p) => p.id === id);
