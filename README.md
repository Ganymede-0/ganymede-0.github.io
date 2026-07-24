# ganymede-0 — orbital portfolio

An interactive 3D portfolio. Projects orbit Jupiter as planets; professional
experience orbits as a station. Selecting a body flies the camera to it, brings
the system to a standstill, and opens a full technical case study in a flat,
readable panel.

Built with React Three Fiber, GSAP, and Vite. Static output, no backend, no
image assets — deploys to GitHub Pages from a single push.

---

## Design decisions worth knowing

**The center is the thesis.** Jupiter sits at the origin with Ganymede tucked
close in — the namesake of the account, and the only light source in the scene.
Every project is lit from that identity outward.

**Distance is a variable.** Orbit radius encodes recency, not decoration: the
station (COOP, the newest professional context) orbits closest, and projects
sit further out. Reorder by editing `orbitRadius` in `src/data/projects.js`.

**Silhouette encodes category.** Projects are spheres with soft atmospheric
limbs. Experience is a hard-edged metal assembly. A visitor reads the
difference before reading a single word.

**Motion is the transition.** When you select a body, the entire system
decelerates to a stop as the camera arrives (`orbitClock.scale` tweens to 0),
and spins back up when you return. Nothing keeps drifting behind the panel
while you read.

**The signature: the orbit becomes the rule.** The case study panel's header
line arrives as the same dashed curve you were just looking at in 3D, then
flattens into a straight rule. It's the one flourish in the UI layer —
everything below it is flat, high-contrast, and set for reading.

**The 3D is atmospheric; the UI is not.** Panels sit at 94% opacity on near-black
with body text at ~16px and generous line height, because the actual job of this
site is to make three technical case studies easy to read on a laptop.

---

## Architecture

```
src/
├── main.jsx                    React root
├── App.jsx                     Composes canvas + overlay + boot
│
├── data/
│   └── projects.js             SINGLE SOURCE OF TRUTH — all copy, metrics,
│                               links, orbit parameters, colors
├── state/
│   └── navigationStore.js      zustand: view ('overview' | 'transitioning' |
│                               'focus'), activeId, hoveredId
├── scene/
│   ├── Scene.jsx               <Canvas>, lighting, fog, post-processing,
│   │                           PerformanceMonitor
│   ├── CameraRig.jsx           OrbitControls + GSAP flight timeline
│   ├── orbitClock.js           Module-level clock + body registry (no
│   │                           per-frame React re-renders)
│   ├── JovianCore.jsx          Jupiter + Ganymede + the system's light
│   ├── Planet.jsx              A project body
│   ├── Station.jsx             The experience body
│   ├── OrbitPath.jsx           Dashed trajectory lines
│   ├── AtmosphereShell.jsx     Fresnel rim-light shader
│   ├── Starfield.jsx           Single-instance drei <Stars>
│   ├── proceduralTextures.js   Canvas-generated planet surfaces
│   └── useReducedMotion.js     prefers-reduced-motion hook
└── ui/
    ├── Hud.jsx                 Identity, mission index, contact, hint
    ├── MissionPanel.jsx        Case study panel + orbit-rule signature
    ├── BootSequence.jsx        Cold open while the scene compiles
    └── styles/                 tokens.css (palette/type) + ui.css
```

### How navigation flows

1. Click a planet (or a mission index button, or tab + Enter) →
   `focusBody(id)` sets `view: 'transitioning'`.
2. `CameraRig` sees the change, disables `OrbitControls`, reads the body's
   *live* world position from `bodyRegistry`, and runs one GSAP timeline that
   moves `camera.position`, `controls.target`, and `orbitClock.scale` together.
3. `onComplete` re-enables controls and sets `view: 'focus'`, which mounts the
   mission panel.
4. Escape, the back button, or a click on empty space reverses it.

Controls stay disabled during flight so user input and GSAP never fight over
the camera — the single most common bug in R3F portfolios.

### Performance

- Zero external assets. Planet surfaces are generated on a 256px canvas at
  runtime, so there's nothing to load, compress, or path-resolve.
- One `<Stars>` instance rather than several stacked ones.
- `PerformanceMonitor` drops DPR, then disables post-processing, before it
  drops frames.
- `three` and the R3F stack are split into separate chunks so returning
  visitors only re-fetch your code.
- Post-processing is a single merged effect pass (bloom + vignette).

### Accessibility floor

- Every body is reachable from the keyboard via the mission index — nothing is
  clickable *only* as a moving 3D object.
- `prefers-reduced-motion` collapses camera flights to instant cuts, stops
  auto-rotation, disables bloom, and skips the panel and rule animations.
- Visible focus rings, real `<button>` and `<a>` elements, `Escape` to close.

---

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # → dist/
npm run preview    # serve the production build locally
```

Node 18+ required.

---

## Deploying to GitHub Pages

You do **not** need to wait for GitHub Education to do this. Pages is free on
public repos for everyone. (Student Pack / Pro only matters if you want Pages
on a *private* repo — and if that benefit ever lapses, the site 404s until you
make the repo public again. For a portfolio meant to be seen, public is the
right call anyway.)

### 1. Pick your URL

**Recommended:** name the repo `ganymede-0.github.io`. It's served at
`https://ganymede-0.github.io/` and `base: '/'` in `vite.config.js` is already
correct.

**Alternative:** any other repo name, e.g. `orbital-portfolio`, is served at
`https://ganymede-0.github.io/orbital-portfolio/` — in that case change
`vite.config.js` to `base: '/orbital-portfolio/'`. A wrong `base` is the #1
cause of a blank white page on Pages.

### 2. Push

```bash
git init
git add .
git commit -m "Orbital portfolio"
git branch -M main
git remote add origin https://github.com/ganymede-0/ganymede-0.github.io.git
git push -u origin main
```

### 3. Turn Pages on

Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.

That's the whole setup. `.github/workflows/deploy.yml` builds and publishes on
every push to `main` using the official `upload-pages-artifact` /
`deploy-pages` actions — no `gh-pages` branch, no `gh-pages` package, no
tokens to manage.

---

## Editing content

Everything a recruiter reads lives in `src/data/projects.js`. Adding a fourth
project is one object in that array — orbit path, planet, label, index entry,
and case study panel all derive from it.

Two `TODO`s are waiting in that file:

- **Repo links** are placeholder URLs. Point them at the real repositories.
- **The Leap Networks entry is thin.** It's the one node with no metrics, and
  it's the node an industrial-AI hiring manager will look at hardest. Two or
  three concrete lines — what you touched, what shipped, what you'd say out
  loud if someone asked "so what did you actually do there?" — will do more for
  this portfolio than any amount of additional 3D.
