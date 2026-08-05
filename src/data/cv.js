// -----------------------------------------------------------------------------
// The résumé, as data. Single source of truth for the CV navigation (bottom-left)
// and the CV panel.
//
// EDITORIAL DIRECTION: the audience is technical directors and talent leads at
// industrial AI and energy organisations in the Eastern Province — Aramco
// Digital, Leap Networks, and their integrator ecosystem. Copy is therefore
// written in the vocabulary those teams actually use: asset reliability,
// condition monitoring, operational telemetry, anomaly detection, on-premise
// deployment. Outcome first, metric attached, no student framing.
//
// Section order here IS the order in the nav and the panel. `projectId` links a
// system to its orbiting body so the panel can fly the camera to it.
// -----------------------------------------------------------------------------

// KEYWORD DIRECTION: these four terms are what the Saudi market actually
// screens for, and each is backed by real work in this CV — a keyword you
// cannot defend in an interview is worse than no keyword.
//
//   Machine Learning  — the broad term recruiters and ATS filters search first.
//   Computer Vision   — the OpenCV/nnU-Net pipeline work.
//   Generative AI     — the fine-tuned 7B advisory model in Bayan. This is the
//                       single highest-value term in KSA right now: SDAIA,
//                       Aramco, NEOM and stc are all hiring against it.
//   MLOps             — on-premise deployment, Docker, Linux provisioning.
//
// "Industrial AI" was dropped deliberately. It described the work accurately
// but reads as a niche, and it narrows her to one sector before a human has
// even read the page. The industrial depth is still everywhere in the project
// copy, where it lands as evidence rather than as a self-imposed limit.
export const identity = {
  name: 'Sarah Khalid Altheeb',
  headline:
    'Artificial Intelligence Engineer · Machine Learning · Computer Vision · Generative AI · MLOps',
  location: 'Al Khobar, Eastern Province, Saudi Arabia',
  languages: 'Arabic (native) · English (fluent)',
  contact: {
    email: 'sarah.altheeeb@gmail.com',
    github: 'https://github.com/ganymede-0',
    linkedin: 'https://linkedin.com/in/sarah-altheeb',
  },
}

export const cvSections = [
  {
    id: 'profile',
    code: '00',
    label: 'Profile',
    kind: 'prose',
    body:
      'Artificial Intelligence engineer building production systems that convert raw ' +
      'operational telemetry into decisions the field can act on. Experience spans the ' +
      'full delivery path — data ingestion and validation, model development for anomaly ' +
      'detection and equipment condition monitoring, and on-premise deployment into live ' +
      'industrial environments. Contributed to enterprise-scale predictive maintenance and ' +
      'safety platforms serving Tier-1 industrial clients, with a consistent emphasis on ' +
      'asset performance, system reliability, and models whose outputs a maintenance ' +
      'engineer can defend.',
  },

  {
    id: 'experience',
    code: '01',
    label: 'Engineering Experience',
    kind: 'timeline',
    items: [
      {
        role: 'Artificial Intelligence Engineer — COOP',
        org: 'Leap Networks Arabia',
        period: 'Jun 2026 – Aug 2026',
        points: [
          'Built a Python/OpenCV ingestion pipeline processing raw CCTV footage into 800+ validated training frames, supplying the safety-monitoring models deployed for industrial clients.',
          'Supported on-premise rollout of the Leap AI Engine — provisioning native Linux environments and configuring Docker containers for real-time equipment monitoring and anomaly detection inside client infrastructure.',
          'Designed and integrated custom features across Leap’s Django/Next.js ERP and RTLS/SSMS AI platforms, automating operational workflows end to end.',
          'Ran exploratory data analysis to validate dataset integrity before training, and maintained the technical documentation supporting handover.',
        ],
      },
    ],
  },

  {
    id: 'systems',
    code: '02',
    label: 'Engineered Systems',
    kind: 'projects',
    items: [
      {
        name: 'Bayan — Predictive Maintenance & Remaining Useful Life',
        projectId: 'bayan',
        period: 'Jan – May 2026',
        blurb:
          'Transformer-based encoder for equipment condition monitoring and Remaining Useful Life estimation, ranking in the top 15% of published deep learning methods on the C-MAPSS benchmark — directly transferable to upstream oil & gas asset monitoring. A fine-tuned 7B-parameter LLM converts structured anomaly signals into severity-classified maintenance advisories, scoring 0.92 BERTScore against expert-written reports.',
        stack: ['PyTorch', 'Hugging Face Transformers', 'LLM fine-tuning', 'Time-series modelling'],
      },
      {
        name: 'Raha — Volumetric Imaging & Automated Analysis Platform',
        projectId: 'raha',
        period: 'Jan – May 2026 · Senior Graduation Project',
        blurb:
          'Full-stack platform processing 90+ GB of high-dimensional 3D scan data into validated, actionable metrics. A multi-stage pipeline pairs a U-Net localizer resolving targets to within ~1 voxel with a segmentation stage achieving a 0.95+ Dice score, packaged under MLOps practice for deployment behind a cloud web interface.',
        stack: ['PyTorch', 'MONAI', 'nnU-Net', 'FastAPI', 'PostgreSQL'],
        badge: '2nd Place · Graduation Projects Showcase 2026',
      },
      {
        name: 'Sharqiyah — Eastern Province Market Analytics',
        projectId: 'sharqiyah',
        period: 'Jan – Apr 2026',
        blurb:
          'CatBoost regression model reaching R² = 0.794 across 5+ years of Eastern Province transaction data, with log-transformation and processing components engineered to absorb extreme outliers. Deployed as an analytics dashboard whose Hybrid Forecasting Engine combines the ML baseline with dynamic CAGR mathematics to extrapolate beyond the horizon tree-based models can reach.',
        stack: ['CatBoost', 'Scikit-learn', 'Streamlit', 'Pandas', 'Plotly'],
      },
    ],
  },

  {
    id: 'academics',
    code: '03',
    label: 'Academic Core',
    kind: 'timeline',
    items: [
      {
        role: 'B.Sc. Artificial Intelligence',
        org: 'Imam Abdulrahman Bin Faisal University — Dammam',
        period: 'Jun 2026',
        points: [
          'College of Computer Science & Information Technology, Computer Engineering Department · Graduated with Honours.',
          'Coursework: Data Science & Analytics, Machine Learning, Deep Learning, Natural Language Processing, Generative AI, Computer Vision.',
        ],
      },
    ],
  },

  {
    id: 'stack',
    code: '04',
    label: 'Technical Stack',
    kind: 'stack',
    groups: [
      { label: 'Languages', items: ['Python', 'SQL', 'C++'] },
      {
        label: 'Machine Learning',
        items: ['PyTorch', 'TensorFlow', 'Hugging Face', 'Scikit-learn', 'XGBoost', 'CatBoost', 'OpenCV'],
      },
      { label: 'Data & Serving', items: ['FastAPI', 'PostgreSQL', 'Streamlit', 'Pandas', 'NumPy'] },
      { label: 'Deployment & Operations', items: ['Docker', 'Linux', 'Git / GitHub', 'MLOps', 'VS Code'] },
    ],
  },

  {
    id: 'recognition',
    code: '05',
    label: 'Recognition',
    kind: 'list',
    items: [
      {
        title: '2nd Place — Graduation Projects Showcase 2026',
        detail:
          'Awarded among AI-major projects for Raha, an automated platform processing 3D imaging data into clinical metrics for research use.',
      },
      {
        title: 'KSAU Innovation Hackathon 2026 · Riyadh',
        detail:
          'Selected from 1,500+ applicants as a top participant; Certificate of Recognition from King Saud bin Abdulaziz University for Health Sciences.',
      },
    ],
  },
]
