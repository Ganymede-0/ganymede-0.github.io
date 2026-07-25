// -----------------------------------------------------------------------------
// The résumé, as data. This is the single source of truth for the CV navigation
// (bottom-left) and the CV panel. Copy is phrased for recruiters — outcome-first,
// lightly generalized — while staying faithful to the source CV.
//
// Section order here IS the order in the nav and the panel. `projectId` links a
// flagship system to its orbiting planet so the panel can fly the camera to it.
// -----------------------------------------------------------------------------

export const identity = {
  name: 'Sarah Khalid Altheeb',
  headline: 'AI Engineer · Computer Vision · Deep Learning · MLOps',
  location: 'Al Khobar, Saudi Arabia',
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
      'Final-year Artificial Intelligence engineer specializing in end-to-end ' +
      'deep-learning systems — from raw data pipelines through to deployed, ' +
      'cloud-served inference. Hands-on across 3D medical computer vision, ' +
      'time-series forecasting with Transformers, and applied analytics, with a ' +
      'consistent focus on models that are reproducible, explainable, and ' +
      'genuinely useful to the people who act on their output.',
  },

  {
    id: 'experience',
    code: '01',
    label: 'Engineering Experience',
    kind: 'timeline',
    items: [
      {
        role: 'Cooperative Engineering Trainee',
        org: 'Leap Networks Arabia',
        period: '2024',
        points: [
          'Worked in a live operational environment on external clients’ tracking networks and video systems, bridging day-to-day operations with an engineering perspective.',
          'Supported the reliability and observability of client-facing infrastructure in production — not just in a lab setting.',
        ],
      },
    ],
  },

  {
    id: 'systems',
    code: '02',
    label: 'Flagship Systems',
    kind: 'projects',
    items: [
      {
        name: 'Raha — Automated 3D Medical Scan Analysis',
        projectId: 'raha',
        period: 'Jan–May 2026 · Senior Graduation Project',
        blurb:
          'Full-stack platform turning 90+ GB of volumetric medical scans into clean clinical metrics. A multi-stage 3D pipeline (U-Net localizer → segmentation) reached a 0.95+ Dice score, packaged with MLOps practices for cloud web delivery.',
        stack: ['PyTorch', 'MONAI', 'nnU-Net', 'FastAPI', 'PostgreSQL'],
        badge: '2nd place · Graduation Showcase 2026',
      },
      {
        name: 'Bayan — Industrial Predictive Maintenance',
        projectId: 'bayan',
        period: 'Jan–May 2026',
        blurb:
          'A Transformer encoder for Remaining-Useful-Life estimation ranking in the top 15% of published methods on C-MAPSS, paired with a fine-tuned 7B LLM that converts forecasts into severity-classified maintenance advisories at 0.92 BERTScore — directly applicable to upstream oil & gas monitoring.',
        stack: ['PyTorch', 'Hugging Face', 'Transformers', 'LLM fine-tuning'],
      },
      {
        name: 'Sharqiyah — Real-Estate Market Analytics',
        projectId: 'sharqiyah',
        period: 'Jan–Apr 2026',
        blurb:
          'A CatBoost regression model (R² = 0.794) over 5+ years of Eastern-Province transactions, deployed in a Streamlit dashboard with a hybrid ML + CAGR forecasting engine that extrapolates beyond the limits of tree-based models.',
        stack: ['CatBoost', 'Scikit-learn', 'Streamlit', 'Plotly'],
      },
      {
        name: 'MotionSense — Human Activity Recognition',
        period: 'Sep–Dec 2025',
        blurb:
          'A ResNet-BiLSTM hybrid with custom attention at 96% accuracy / 0.96 weighted F1 on UCI-HAR, fusing time-domain attention with FFT frequency features and subject-wise validation to eliminate static-posture misclassification.',
        stack: ['TensorFlow', 'Keras', 'ResNet', 'BiLSTM'],
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
        org: 'Imam Abdulrahman Bin Faisal University',
        period: 'Expected Jun 2026',
        points: [
          'College of Computer Science & Information Technology · GPA 4.58 / 5.00.',
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
      { label: 'Languages', items: ['Python', 'SQL', 'C++', 'Java'] },
      { label: 'ML / Deep Learning', items: ['PyTorch', 'TensorFlow', 'Keras', 'Hugging Face', 'Scikit-learn', 'XGBoost', 'CatBoost', 'MONAI', 'nnU-Net'] },
      { label: 'Data & Serving', items: ['FastAPI', 'PostgreSQL', 'Streamlit', 'Pandas', 'NumPy', 'Plotly'] },
      { label: 'Practice & Tooling', items: ['Git / GitHub', 'Docker', 'MLOps', 'VS Code', 'Google Colab'] },
    ],
  },

  {
    id: 'recognition',
    code: '05',
    label: 'Recognition',
    kind: 'list',
    items: [
      { title: '2nd Place — Graduation Projects Showcase 2026', detail: 'Awarded among AI-major projects for Raha, the 3D medical scan analysis platform.' },
      { title: 'KSAU Innovation Hackathon 2026 · Riyadh', detail: 'Selected from 1,500+ applicants as a top participant; Certificate of Recognition from King Saud bin Abdulaziz University for Health Sciences.' },
      { title: 'Aramco Consulting Championship 2026', detail: 'Selected participant in Saudi Aramco’s consulting competition for university students.' },
    ],
  },
]
