# Ganymede‑0 — Portfolio of Sarah Altheeb

An interactive WebGL portfolio built as an orbital system, where each body is an
engineering project you can fly to and open.

**Live:** [ganymede-0.github.io](https://ganymede-0.github.io)

Built with React Three Fiber, Three.js, GSAP and Zustand. Every planetary
surface, the star, the atmospheres, the orbit filaments and the dust field are
custom GLSL — there are no downloaded textures in this project.

---

## Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # production bundle to dist/
npm run lint
```

No environment variables, no API keys, no backend. The site is fully static and
deploys to GitHub Pages from `.github/workflows/deploy.yml` on push to `main`.

---

## Architecture

```
src/
├── data/          content only — projects.js and cv.js
├── scene/         the 3D system
├── ui/            the 2D interface layered over the canvas
├── state/         navigationStore.js (Zustand)
└── styles/        tokens.css (design tokens) + ui.css
```

The guiding constraint is that **content and rendering never mix.** Updating a
project, a metric or a résumé line touches `src/data/` and nothing else;
`src/scene/` only ever describes how things look and move.
[`docs/CONFIGURATION_GUIDE.md`](docs/CONFIGURATION_GUIDE.md) documents every
content field and its safe range.

---

## Engineering notes

These are the decisions that were not obvious, kept here because the reasoning
matters more than the code.

**Tone mapping is owned in exactly one place.** React Three Fiber defaults the
renderer to `ACESFilmicToneMapping`, and the postprocessing chain ends in an
ACES `<ToneMapping>` pass. Left alone, ACES is applied twice — once per material
and once per frame — which crushes and desaturates the entire scene. The
renderer is pinned to `NoToneMapping` so the composer is the sole owner.

**The effect chain never changes shape at runtime.** An earlier build unmounted
the `EffectComposer` when the frame rate dipped. That doesn't simplify the
scene, it collapses the lighting the scene's exposure was authored against — and
because recovery was asymmetric, it was a one-way latch the scene could never
climb back out of. Resolution is now the only quality dial, so the look is
identical on every machine and only its sharpness varies.

**One controller for resolution.** `AdaptiveDpr` and `PerformanceMonitor` both
write device pixel ratio, so running both made DPR oscillate, and every change
reallocated each render target in the composer. Only `PerformanceMonitor`
remains, judged against absolute FPS rather than drei's refresh‑rate‑relative
default — on a 144 Hz display that default treats a healthy 58 fps as a failure.

**Surfaces are shader injections, not replacement materials.** Each planet's
surface is built with `onBeforeCompile` against `MeshStandardMaterial`, so the
procedural detail composes with real PBR lighting and image‑based reflections
instead of replacing them. The three themes differ in topology *and* in material
response — a polished metal body and a rough sedimentary one react differently
to the same light, which is what stops them reading as one sphere in three
colours.

**Particles use additive blending, deliberately.** Under normal alpha blending a
point sprite's transparent corners still composite their black, and sorted
points stack those quads into visible boxes. Additive blending makes black
mathematically identical to transparent, so the artefact cannot occur at any
viewing angle.

**Atmospheres are gated by the terminator.** A plain fresnel rim glows evenly
around the whole silhouette including the night side, which is the clearest tell
of a fake atmosphere. Scattering here is gated by solar incidence, with a
Rayleigh phase function and a Mie forward lobe, so the halo wraps the lit limb
and dies behind the terminator.

**Nothing is reachable only by clicking a moving 3D object.** The résumé
navigation is a complete, keyboard-accessible path to every part of the story —
the 3D system is the richer way in, never the only one.

---

## Accessibility & performance

- `prefers-reduced-motion` is honoured; animated grain and non-essential motion drop out.
- Camera framing is computed from the viewport, so the system fits a 320 px phone through to an ultrawide display rather than cropping.
- `100dvh` and `env(safe-area-inset-*)` keep the interface clear of notches and mobile browser chrome.
- Device pixel ratio starts conservative on small viewports and is raised only if the frame rate supports it.

---

## Licence

Source is published for review. The written content, résumé material and project
copy are © Sarah Altheeb.
