# GANYMEDE‑0 — Content Management & Configuration Guide

A practical manual for editing this portfolio without touching the rendering
engine. Everything a non‑graphics edit needs — project copy, new orbital
bodies, identity details, camera framing, colours, fonts — is covered here with
the exact file, the exact variable, and the safe range of values.

> **Golden rule:** 99% of content changes happen in **one file** —
> [`src/data/projects.js`](../src/data/projects.js). Start there. Only drop into
> the `src/scene/` files when you want to change how things *look or move*, and
> only touch `src/styles/` for the 2D interface.

---

## 1. Project structure at a glance

```
src/
├── data/
│   └── projects.js          ← ★ ALL content: names, copy, metrics, orbits, links
├── data/
│   ├── projects.js          ← ★ ALL orbital-body content (see §2–4)
│   └── cv.js                ← ★ ALL résumé content (nav + CV panel)
├── scene/                     (the 3D system)
│   ├── Scene.jsx            ← canvas, camera defaults, post‑processing stack
│   ├── Lighting.jsx        ← light rig + reflection environment
│   ├── CameraRig.jsx       ← camera flights + orbit controls + left-framing
│   ├── Sun.jsx             ← the central Sun (your identity) + corona
│   ├── Planet.jsx          ← how a project body is built & animated
│   ├── Station.jsx         ← how an experience/“station” body is built
│   ├── planetMaterials.js  ← ★ the bespoke per‑planet surface shaders
│   ├── glslNoise.js         (shared noise functions — rarely edited)
│   ├── Nebula.jsx           (deep‑space coloured gas backdrop)
│   ├── Starfield.jsx        (two‑layer star field)
│   ├── DustField.jsx        (additive drifting dust particles)
│   ├── AtmosphereShell.jsx  (atmospheric scattering around each body)
│   ├── OrbitPath.jsx        (soft glowing orbit filaments)
│   ├── HoloScan.jsx         (telemetry rig on a focused body)
│   ├── ParallaxRig.jsx      (mouse parallax on the background)
│   └── orbitClock.js        (shared animation clock — do not edit)
├── ui/                        (the 2D interface over the canvas)
│   ├── Hud.jsx             ← ★ name, role, location, contact links
│   ├── CvNav.jsx            (bottom-left CV jump navigation)
│   ├── CvPanel.jsx          (the résumé drawer)
│   ├── MissionPanel.jsx     (the case‑study side panel)
│   ├── CursorHud.jsx        (the terminal reticle cursor)
│   └── StarFallback.jsx     (Suspense fallback — a single breathing star)
├── styles/
│   ├── tokens.css          ← ★ colours, fonts, design tokens
│   └── ui.css               (all interface styling)
└── state/
    └── navigationStore.js   (selected body + CV open state — rarely edited)
```

★ = the files you will actually edit for content and branding.

---

## 2. Editing an existing project

Open [`src/data/projects.js`](../src/data/projects.js). Each body is one object in
the `projects` array. Change the text between the quotes — nothing else in the
codebase needs to change.

| Field | What it controls | Notes |
|-------|------------------|-------|
| `name` | Big title in the panel + floating label | Keep it short. |
| `missionCode` | The `MSN‑01` style tag | Any string; convention is `MSN‑NN` / `OPS‑NN`. |
| `tagline` | One line under the title | ~1 sentence. |
| `summary` | Lead paragraph | 1–2 sentences. |
| `problem` | “The problem” section | |
| `approach` | “What I built” section | |
| `stack` | Tech chips | Array of strings: `['PyTorch', 'Docker']` |
| `metrics` | The numeric readout grid | Array of `{ label, value }`. Empty array `[]` hides it. |
| `competencies` | “Core competencies” chips | Array of strings. |
| `links` | Buttons at the bottom | Array of `{ label, url }`. Empty `[]` hides them. |

**Example — updating a metric:**

```js
metrics: [
  { label: 'Dice score', value: '0.95+' },   // ← edit value or label
  { label: 'Pipeline phases', value: '3' },
],
```

---

## 3. Adding a brand‑new planet

Copy an existing planet object in `projects.js`, paste it into the array, and
give it a **unique `id`**. Then set its placement and identity fields:

```js
{
  id: 'newproject',                 // MUST be unique (lowercase, no spaces)
  category: CATEGORY.PLANET,        // PLANET = project, STATION = experience
  missionCode: 'MSN-04',
  name: 'New Project',
  tagline: 'One-line description',

  // --- Placement in the orbital system ---
  orbitRadius: 16.5,   // distance from the centre (bigger = further out)
  orbitTilt: 0.06,     // radians; tilts the orbit plane
  orbitSpeed: 0.025,   // radians/sec; smaller = slower (outer orbits slower)
  startAngle: 3.1,     // radians; where on the ring it starts (0–6.28)
  size: 1.0,           // body radius (0.9–1.2 is the current range)

  // --- Identity ---
  color: '#8f7fe8',    // accent colour (UI highlights + atmosphere rim)
  emissive: '#3a2f7a', // legacy tint (kept for compatibility)
  surface: 'data',     // ★ which shader skin (see §4). One of:
                       //   'medical' | 'industrial' | 'data'

  // --- Content (see §2) ---
  summary: '…', problem: '…', approach: '…',
  stack: ['…'], metrics: [{ label: '…', value: '…' }],
  competencies: ['…'], links: [{ label: 'Repository', url: 'https://…' }],
},
```

**Placement tips**
- Give each planet an `orbitRadius` a few units larger than the last so orbits
  don’t overlap. Current planets sit at `7.5`, `10.5`, `13.5`; a 4th at
  `16.5` fits cleanly.
- The dashed orbit line and the floating label are generated automatically —
  you do **not** add them anywhere.
- Everything is reachable by keyboard through the “Mission index” — also
  automatic. Nothing else to wire up.

**Adding an experience (station) instead of a project:** set
`category: CATEGORY.STATION` and give it a `surface` value (ignored for
stations — they use the metal station model in `Station.jsx`).

---

## 4. Changing a planet’s visual “skin” (the shaders)

Each planet’s look comes from a **theme** selected by its `surface` field.
The three themes and their meaning:

| `surface` | Used by | Visual signature |
|-----------|---------|------------------|
| `'medical'` | Raha | Bioluminescent cellular tissue, glowing veins, a scan laser sweeping pole‑to‑pole |
| `'industrial'` | Bayan | Forged metal plating, amber lat/long grid, molten fracture seams that pulse |
| `'data'` | Sharqiyah | Topographic contour lines + a drifting holographic data matrix |

To **re‑skin** a planet, just change its `surface` value in `projects.js`.

To **tune a theme’s colours or intensity**, open
[`src/scene/planetMaterials.js`](../src/scene/planetMaterials.js) and edit the
`THEMES` block near the top. Each theme exposes safe, self‑explanatory knobs:

```js
medical: {
  colorA: '#0a2e2b',   // base / shadow colour of the surface
  colorB: '#59d6c8',   // highlight colour
  emit:   '#22c9bd',   // primary glow (veins / grid / contours)
  emit2:  '#d6fffb',   // secondary glow (scan line / molten / holo)
  roughness: 0.4,      // 0 = mirror, 1 = matte
  metalness: 0.0,      // 0 = dielectric, 1 = metal
  env: 0.7,            // strength of environment reflections
  bump: 0.35,          // topography depth (0 = flat, ~0.6 = rugged)
  glsl: `…`            // the surface program — advanced; see below
},
```

You can safely edit every value **except** `glsl` without any graphics
knowledge. The `glsl` string is the actual surface program (GLSL); only edit it
if you’re comfortable with shader code. Adding a **new** theme = add a new key to
`THEMES` with the same shape, then reference it from a project’s `surface`.

---

## 5. Identity, location & contact details

Open [`src/ui/Hud.jsx`](../src/ui/Hud.jsx):

```jsx
<h1 className="identity__name">Sarah Altheeb</h1>
<p className="identity__role mono">Applied AI · computer vision · 3D volumetric imaging</p>
<p className="identity__location mono">Khobar, Saudi Arabia</p>
…
<a href="https://github.com/ganymede-0">GitHub</a>
<a href="https://linkedin.com/in/sarah-altheeb">LinkedIn</a>
<a href="mailto:sarah.altheeeb@gmail.com">Email</a>
```

Edit the text / `href` values directly. The intro overlay lines live in
[`src/ui/BootSequence.jsx`](../src/ui/BootSequence.jsx) in the `LINES` array.

### The résumé content (bottom-left CV nav + CV panel)
All of it lives in [`src/data/cv.js`](../src/data/cv.js):
- `identity` — name, headline, location, languages, contact links.
- `cvSections` — the ordered sections. **This array’s order IS the order of the
  bottom-left nav and the panel.** Each section has an `id`, a `code` (the `00`
  tag), a `label` (what the nav shows), and a `kind` that picks how it renders:
  `prose` · `timeline` · `projects` · `stack` · `list`.
- To link a flagship system to its orbiting planet, give its item a
  `projectId` matching a planet `id` in `projects.js` — that adds the
  “View in orbit” button which flies the camera to it.

### The Sun (central identity body)
[`src/scene/Sun.jsx`](../src/scene/Sun.jsx) renders the star entirely in GLSL:
turbulent convection granulation, limb darkening, a temperature ramp, sunspot
umbrae and faculae, plus a separate additive corona shell. The core is fully
opaque and is the light source the god-rays pass reads from.

**Tuning the Sun's brightness.** Four values compound, so change them together
or the frame blows out. In order of impact:

| Value | File | Now | Effect |
|---|---|---|---|
| `coreUniforms.uIntensity` | `Sun.jsx` | `1.15` | Master brightness of the disc |
| `Bloom luminanceThreshold` | `Scene.jsx` | `0.55` | **Lower = more of the scene glows.** Below ~0.3 the planets bloom too and everything washes white |
| `GodRays weight` / `exposure` | `Scene.jsx` | `0.15` / `0.16` | Strength of the light shafts |
| `pointLight intensity` | `Sun.jsx` | `95` | How hard the star lights the planets |

If you want a brighter star specifically, raise `uIntensity` **first** and leave
the bloom threshold alone — raising brightness and lowering the threshold at the
same time is what produced the earlier whiteout.

**To use a photographic texture instead:** download a sun map (e.g. the free 2K
"Sun" from <https://www.solarsystemscope.com/textures/>, CC BY 4.0) into
`public/textures/`, then feed it to the core material as an `emissiveMap` on a
`meshStandardMaterial` via drei's `useTexture('/textures/2k_sun.jpg')`. Keep the
corona mesh as-is. Note that a static photo loses the animated convection and
the view-dependent limb darkening the shader computes per-frame — the shader is
the better result here, which is why it ships as the default.

---

## 6. Camera & motion tuning

### Starting/overview camera — [`src/scene/Scene.jsx`](../src/scene/Scene.jsx)
```jsx
camera={{ position: [0, 11, 27], fov: 46, near: 0.1, far: 400 }}
```
- `position: [x, y, z]` — where the camera sits at rest. Increase `z` to pull
  back, increase `y` to look down more.
- `fov` — field of view. Lower (35–45) = more cinematic/compressed; higher
  (55–70) = wider/more dramatic.

### The overview “home” + focus framing — [`src/scene/CameraRig.jsx`](../src/scene/CameraRig.jsx)
```js
const OVERVIEW_POSITION = new THREE.Vector3(0, 11, 27) // must match Scene camera
const OVERVIEW_TARGET   = new THREE.Vector3(0, 0, 0)   // what it looks at
```
Inside the focus flight, this line sets how close/high the camera parks next to
a selected body:
```js
const camPos = bodyPos.clone()
  .add(outward.multiplyScalar(3.6))          // ← distance out from the body
  .add(new THREE.Vector3(0, 1.5, 2.6))       // ← extra height / side offset
```
- Flight duration: `const duration = reducedMotion ? 0.01 : 1.5` (seconds).
- Zoom limits & auto‑rotate: the `<OrbitControls>` props at the bottom
  (`minDistance`, `maxDistance`, `autoRotateSpeed`).

**Left-framing balance:** the focused planet is pushed to the left so it
balances the right-side panel. The strength is the `0.42` factor in
`target.add(right.multiplyScalar(halfW * 0.42))` — `0` centres the body, larger
values push it further left. It’s derived from the panel covering the right
~42vw; if you change the panel width, match this number.

### Orbit speed of the whole system
Each body’s `orbitSpeed` is in `projects.js` (§3). The global spin‑up/spin‑down
on focus is handled automatically by `orbitClock` — no edit needed.

---

## 7. Global colours & fonts

### Colours & design tokens — [`src/styles/tokens.css`](../src/styles/tokens.css)
```css
--color-void:      #05070d;  /* background */
--color-amber:     #d98e4a;  /* primary highlight */
--color-cyan:      #6fe7dc;  /* data accent */
--color-starlight: #f2f4f8;  /* main text */
```

### Typography — `tokens.css`
**Sora (variable, 100–800) everywhere.** Loaded in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@100..800&display=swap" rel="stylesheet" />
```
```css
--font-display: 'Sora', …;  /* all four roles resolve to Sora */
--font-body:    'Sora', …;
--font-tech:    'Sora', …;
--font-mono:    'Sora', …;

--w-xbold: 700;  --w-bold:  600;  /* headers, buttons */
--w-semi:  500;  --w-med:   400;  /* instrument labels, codes, status */
--w-reg:   300;  --w-light: 200;  /* reading material, data logs */
```

### Long-form readability
Body copy is deliberately set at **300**, not 400. Light text on a dark ground
renders optically bolder than the same weight printed dark-on-light, so 300 here
matches the colour of a normal 400 on paper; at 400 the paragraphs go heavy and
the lines stop separating. Two tokens control the reading rhythm:
```css
--measure: 62ch;       /* max line length — past ~70ch the eye loses the line return */
--leading-copy: 1.75;  /* line-height; Sora's tall x-height needs more than 1.5 */
```
Both are applied by a single shared rule in `ui.css` covering `.cv-prose`,
`.mission-panel__summary`, `.mission-panel__section p`, `.cv-system__blurb`,
`.cv-entry__points li` and `.cv-award__detail` — change them in one place and
every paragraph in the app follows. The `.mono` class adds `tabular-nums` so
numeric readouts stay column-aligned without a monospaced face.
The fonts are loaded in [`index.html`](../index.html) via a single Google Fonts
`<link>`. To swap a font: change the family name in that link **and** the
matching `--font-*` token. Keep the fallback stack after the comma.

---

## 8. Post‑processing & atmosphere (visual polish)

In [`src/scene/Scene.jsx`](../src/scene/Scene.jsx), inside `<EffectComposer>`:
- **`<GodRays …/>`** — volumetric light shafts from the Sun. `weight` and
  `exposure` control strength; `samples` is the quality/cost knob.
- **`<Bloom intensity={0.85} luminanceThreshold={0.22} …/>`** — the glow.
  Raise `intensity` for more bloom; raise `luminanceThreshold` so only the
  brightest things glow.
- **`<Vignette offset darkness />`** — the dark edge framing.
- **`<ChromaticAberration/>`** — the subtle lens colour‑fringe.
- **`<Noise opacity={0.45}/>`** — film grain.

Signature mechanics (each in its own file, safe to tune or delete):
- [`src/scene/HoloScan.jsx`](../src/scene/HoloScan.jsx) — the telemetry scan rig
  around a focused planet (ring radii/speeds at the top of `useFrame`).
- [`src/scene/ParallaxRig.jsx`](../src/scene/ParallaxRig.jsx) — mouse-parallax on
  the deep background (tilt amounts: the `0.035` / `0.05` constants).
- [`src/ui/CursorHud.jsx`](../src/ui/CursorHud.jsx) — the terminal reticle
  cursor (styles under `.cursor-hud` in `ui.css`).

The light rig and reflections live in
[`src/scene/Lighting.jsx`](../src/scene/Lighting.jsx) — key/fill/rim lights plus a
baked `Environment`. The nebula colours are in
[`src/scene/Nebula.jsx`](../src/scene/Nebula.jsx).

Weak GPUs automatically drop resolution and then disable post‑processing via the
`<PerformanceMonitor>` — you don’t have to manage that.

---

## 9. Run, build & deploy

```bash
npm install        # first time only
npm run dev        # local dev server with hot reload (http://localhost:5173)
npm run build      # production build → dist/
npm run preview    # preview the production build locally
```

This deploys as a static site (GitHub Pages). Because every texture is
generated in‑code (no image files), there are no asset paths to break — the
`dist/` folder is fully self‑contained.

---

## 10. Quick task index

| I want to… | Go to | Edit |
|------------|-------|------|
| Change project text / metrics | `src/data/projects.js` | the project object (§2) |
| Add a new planet | `src/data/projects.js` | new array entry (§3) |
| Re‑skin a planet | `src/data/projects.js` | its `surface` field (§4) |
| Recolour a planet’s surface | `src/scene/planetMaterials.js` | `THEMES` block (§4) |
| Change name / location / links | `src/ui/Hud.jsx` | the identity + contact JSX (§5) |
| Move the camera | `Scene.jsx` + `CameraRig.jsx` | camera position / offsets (§6) |
| Change accent colours | `src/styles/tokens.css` | `--color-*` tokens (§7) |
| Change fonts | `index.html` + `tokens.css` | font link + `--font-*` (§7) |
| Tune glow / vignette | `src/scene/Scene.jsx` | `<EffectComposer>` (§8) |
```
