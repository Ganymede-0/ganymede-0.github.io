import * as THREE from 'three'
import { SIMPLEX_3D } from './glslNoise'

// -----------------------------------------------------------------------------
// Bespoke planet surfaces.
//
// Each body is a MeshStandardMaterial patched through onBeforeCompile — NOT a
// raw ShaderMaterial. That distinction matters: by injecting into the standard
// shader we keep the full physically-based lighting pipeline (the key/fill/rim
// rig and the baked IBL environment), and we *add* a procedural identity on top
// of it: albedo, roughness, metalness, real bump-mapped topography, and animated
// emissive energy. The surface responds to the scene lights like a real world,
// then does something no texture could.
//
// The theme is chosen per project via `project.surface`:
//   'medical'    (Raha)      — bioluminescent cellular tissue + sweeping scan laser
//   'industrial' (Bayan)     — forged metal, amber grid, molten fracture seams
//   'data'       (Sharqiyah) — topographic contours + holographic data matrix
// -----------------------------------------------------------------------------

// Each theme provides: base material params + two GLSL functions,
//   float heightField(vec3 p)                        -> drives bump/topography
//   void  themeSurface(vec3 p, vec3 on, out ...)     -> albedo/rough/metal/emit
const THEMES = {
  // --- Raha -----------------------------------------------------------------
  medical: {
    colorA: '#0a2e2b',
    colorB: '#59d6c8',
    emit: '#22c9bd',
    emit2: '#d6fffb',
    roughness: 0.4,
    metalness: 0.0,
    env: 0.7,
    bump: 0.35,
    glsl: /* glsl */ `
      float heightField(vec3 p){
        float cell = fbm(p * 2.2);
        float ridge = 1.0 - abs(fbm(p * 3.0 + 4.0));
        return cell * 0.5 + ridge * 0.5;
      }
      void themeSurface(vec3 p, vec3 on, out vec3 albedo, out float rough, out float metal, out vec3 emit){
        float cell = fbm(p * 2.2);
        float ridge = 1.0 - abs(fbm(p * 3.0 + 4.0));
        float vein = smoothstep(0.72, 0.96, ridge);
        albedo = mix(uColorA, uColorB, smoothstep(-0.4, 0.6, cell) * 0.55);
        albedo = mix(albedo, uColorB * 1.15, vein * 0.5);
        rough = 0.30 + 0.22 * cell;
        metal = 0.0;
        // scanning laser: a thin bright latitude band sweeping pole to pole
        float sweep = fract(uTime * 0.12);
        float band = smoothstep(0.016, 0.0, abs((on.y * 0.5 + 0.5) - sweep));
        emit = uEmit * (vein * 1.4);
        emit += uEmit2 * band * 2.4;
        emit += uEmit * 0.14 * (0.5 + 0.5 * sin(uTime * 1.5)); // faint tissue pulse
      }
    `,
  },

  // --- Bayan ----------------------------------------------------------------
  industrial: {
    colorA: '#2b2620',
    colorB: '#4a4239',
    emit: '#d98e4a',
    emit2: '#ff6a1a',
    roughness: 0.5,
    metalness: 0.9,
    env: 1.3,
    bump: 0.5,
    glsl: /* glsl */ `
      float heightField(vec3 p){
        float plates = fbm(p * 1.6);
        float crackN = 1.0 - abs(fbm(p * 2.6 + 10.0));
        float crack = smoothstep(0.85, 1.0, crackN);
        return plates * 0.6 - crack * 0.9;
      }
      void themeSurface(vec3 p, vec3 on, out vec3 albedo, out float rough, out float metal, out vec3 emit){
        float plates = fbm(p * 1.6);
        float crackN = 1.0 - abs(fbm(p * 2.6 + 10.0));
        float crack = smoothstep(0.86, 0.99, crackN);
        float lat = asin(clamp(on.y, -1.0, 1.0));
        float lon = atan(on.z, on.x);
        float gLat = smoothstep(0.90, 1.0, abs(sin(lat * 10.0)));
        float gLon = smoothstep(0.90, 1.0, abs(sin(lon * 14.0)));
        float grid = max(gLat, gLon);
        albedo = mix(uColorA, uColorB, smoothstep(-0.3, 0.5, plates));
        albedo = mix(albedo, vec3(0.015), crack * 0.7);
        rough = mix(0.30, 0.72, smoothstep(-0.2, 0.6, plates));
        metal = mix(0.92, 0.15, crack);
        float pulse = 0.55 + 0.45 * sin(uTime * 2.2 + lon * 3.0);
        emit = uEmit * grid * 0.5;
        emit += uEmit2 * crack * 2.6 * pulse;
      }
    `,
  },

  // --- Sharqiyah ------------------------------------------------------------
  data: {
    colorA: '#0e1b2b',
    colorB: '#1c3550',
    emit: '#c9a45c',
    emit2: '#57c8e4',
    roughness: 0.5,
    metalness: 0.1,
    env: 0.8,
    bump: 0.4,
    glsl: /* glsl */ `
      float heightField(vec3 p){
        return fbm(p * 1.8) * 0.85;
      }
      void themeSurface(vec3 p, vec3 on, out vec3 albedo, out float rough, out float metal, out vec3 emit){
        float terr = fbm(p * 1.8);
        float elev = terr * 0.5 + 0.5;
        // topographic contour rings from elevation bands
        float cont = abs(fract(elev * 10.0) - 0.5);
        float contour = smoothstep(0.07, 0.0, cont);
        // holographic lat/long data matrix, drifting
        float lat = asin(clamp(on.y, -1.0, 1.0));
        float lon = atan(on.z, on.x);
        float gLat = smoothstep(0.93, 1.0, abs(sin(lat * 16.0 + uTime * 0.2)));
        float gLon = smoothstep(0.93, 1.0, abs(sin(lon * 20.0)));
        float grid = max(gLat, gLon);
        float scan = 0.6 + 0.4 * sin(on.y * 22.0 - uTime * 3.0); // CRT-style flicker
        albedo = mix(uColorA, uColorB, elev);
        rough = 0.5;
        metal = 0.1;
        emit = uEmit * contour * 1.35;
        emit += uEmit2 * grid * 1.25 * scan;
      }
    `,
  },
}

export function createPlanetMaterial(project) {
  const cfg = THEMES[project.surface] || THEMES.data

  // One uniform bag, shared into the compiled shader. Because we hold the same
  // object reference, mutating `uniforms.uTime.value` from useFrame drives the
  // live shader — no need to reach into shader.uniforms after compile.
  const uniforms = {
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color(cfg.colorA) },
    uColorB: { value: new THREE.Color(cfg.colorB) },
    uEmit: { value: new THREE.Color(cfg.emit) },
    uEmit2: { value: new THREE.Color(cfg.emit2) },
    uEmitStrength: { value: 1 },
    uBump: { value: cfg.bump },
  }

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(cfg.colorA),
    roughness: cfg.roughness,
    metalness: cfg.metalness,
    emissive: new THREE.Color('#000000'),
    envMapIntensity: cfg.env,
    transparent: true,
    opacity: 1,
  })

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)

    // Vertex: expose object-space position and the (per-object constant) normal
    // matrix so the fragment stage can rebuild a bump-perturbed view normal.
    shader.vertexShader =
      'varying vec3 vObjPos;\nvarying mat3 vNMat;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vObjPos = position;
        vNMat = normalMatrix;`
      )

    const preamble = /* glsl */ `
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uEmit;
      uniform vec3 uEmit2;
      uniform float uEmitStrength;
      uniform float uBump;
      varying vec3 vObjPos;
      varying mat3 vNMat;
      ${SIMPLEX_3D}
      vec3 gAlbedo = vec3(0.0);
      float gRough = 0.5;
      float gMetal = 0.0;
      vec3 gEmit = vec3(0.0);
      ${cfg.glsl}
    `

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + preamble)
      // Compute the whole surface once, early (before color/rough/metal read it).
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        themeSurface(vObjPos, normalize(vObjPos), gAlbedo, gRough, gMetal, gEmit);`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        diffuseColor.rgb = gAlbedo;`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(gRough, 0.04, 1.0);`
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
        metalnessFactor = clamp(gMetal, 0.0, 1.0);`
      )
      // Real topography: analytic gradient of the height field -> perturbed
      // view-space normal, so the key light actually rakes across the detail.
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          vec3 on = normalize(vObjPos);
          float e = 0.02;
          float h0 = heightField(vObjPos);
          vec3 grad = vec3(
            heightField(vObjPos + vec3(e, 0.0, 0.0)) - h0,
            heightField(vObjPos + vec3(0.0, e, 0.0)) - h0,
            heightField(vObjPos + vec3(0.0, 0.0, e)) - h0
          ) / e;
          grad -= on * dot(grad, on);
          vec3 on2 = normalize(on - grad * uBump);
          normal = normalize(vNMat * on2);
        }`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += gEmit * uEmitStrength;`
      )
  }

  material.userData.uniforms = uniforms
  return material
}
