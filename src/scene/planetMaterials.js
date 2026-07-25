import * as THREE from 'three'
import { SIMPLEX_3D } from './glslNoise'

// -----------------------------------------------------------------------------
// Bespoke planet surfaces.
//
// Each body is a MeshStandardMaterial patched through onBeforeCompile — NOT a
// raw ShaderMaterial. By injecting into the standard shader we keep the full
// physically-based pipeline (key/fill/rim lights + the baked IBL environment)
// and *add* a procedural identity: albedo, roughness, metalness, real
// bump-mapped topography, and animated emissive energy.
//
// The three bodies deliberately differ in STRUCTURE and MATERIAL RESPONSE, not
// just hue — that's what stops them reading as one sphere in three colours:
//
//   medical    (Raha)      organic cell membranes · wet, low-roughness,
//                          dielectric · red sub-surface bleed at the limb
//   industrial (Bayan)     hard rectangular armour plating · near-full metal,
//                          brushed · molten cracks on a blackbody ramp
//   data       (Sharqiyah) ridged continental terrain · bone-dry matte ·
//                          hard contour lines + rectilinear holo grid
//
// PERFORMANCE CONTRACT: `heightField` is evaluated FOUR times per fragment (the
// bump gradient), so it must stay cheap — one or two noise calls, no loops.
// `themeSurface` runs once, so it carries the expensive detail. Respect this
// split when editing or the frame rate will fall off a cliff.
// -----------------------------------------------------------------------------

const THEMES = {
  // --- Raha · organic / medical ---------------------------------------------
  medical: {
    roughness: 0.28,
    metalness: 0.0,
    env: 0.55,
    bump: 0.3,
    rimColor: '#ff4d6a', // blood-red scatter through thin tissue
    rimPower: 2.4,
    rimStrength: 0.9,
    glsl: /* glsl */ `
      // Cheap pseudo-cellular field: ridged noise inverted so the ridges form
      // closed membrane walls around smooth interiors. Two calls, no loop.
      float heightField(vec3 p){
        float m = 1.0 - abs(snoise(p * 2.6));
        return m * m * 0.8;
      }
      void themeSurface(vec3 p, vec3 on, out vec3 albedo, out float rough, out float metal, out vec3 emit){
        float m  = 1.0 - abs(snoise(p * 2.6));
        float m2 = 1.0 - abs(snoise(p * 6.1 + 21.0));   // finer sub-structure
        float wall  = smoothstep(0.74, 0.99, m);         // membrane walls
        float micro = smoothstep(0.80, 1.0, m2);         // capillaries
        float interior = 1.0 - wall;

        // Wet tissue: deep oxblood interiors, pale translucent membranes.
        albedo = mix(vec3(0.16, 0.03, 0.05), vec3(0.62, 0.20, 0.24), interior * 0.7);
        albedo = mix(albedo, vec3(0.95, 0.72, 0.70), wall * 0.55);

        // Membranes are wet and glossy; interiors are softer.
        rough = mix(0.42, 0.14, wall);
        metal = 0.0;

        // MRI acquisition sweep — a hard slice plane travelling pole to pole,
        // brightest exactly at the slice, like a reconstruction in progress.
        float slice = fract(uTime * 0.1);
        float band  = smoothstep(0.02, 0.0, abs((on.y * 0.5 + 0.5) - slice));

        emit  = uEmit * wall * 0.9;                       // glowing membranes
        emit += uEmit2 * micro * 0.5;                     // capillary sparkle
        emit += uEmit2 * band * 2.6;                      // the scan slice
        emit *= 0.75 + 0.25 * sin(uTime * 1.6 + m * 6.0); // living pulse
      }
    `,
    emit: '#ff2d55',
    emit2: '#8affe4',
  },

  // --- Bayan · forged / industrial ------------------------------------------
  industrial: {
    roughness: 0.42,
    metalness: 0.95,
    env: 1.6,
    bump: 0.6,
    rimColor: '#ff7a18',
    rimPower: 3.2,
    rimStrength: 0.5,
    glsl: /* glsl */ `
      // Irregular forged plating. Everything is driven by 3D noise in object
      // space — NO lat/long lattice, which is what makes a sphere look like a
      // wireframe globe and pinches at the poles. Plates are terraced noise
      // (hard steps, organic outlines) and the seams between them are a ridged
      // fracture network, the way real thermal stress actually cracks metal.
      float heightField(vec3 p){
        float plate = terrace(snoise(p * 1.25) * 0.5 + 0.5, 4.0);
        float crack = 1.0 - abs(snoise(p * 2.3 + 9.0));
        return plate * 0.5 - smoothstep(0.88, 1.0, crack) * 0.9;
      }
      void themeSurface(vec3 p, vec3 on, out vec3 albedo, out float rough, out float metal, out vec3 emit){
        float raw   = snoise(p * 1.25) * 0.5 + 0.5;
        float plate = terrace(raw, 4.0);
        float crackN = 1.0 - abs(snoise(p * 2.3 + 9.0));
        float crack  = smoothstep(0.88, 1.0, crackN);

        // Fine mill scale and scorching across the plates.
        float scale = snoise(p * 9.0) * 0.5 + 0.5;
        float soot  = snoise(p * 3.2 + 30.0) * 0.5 + 0.5;

        vec3 steel = mix(vec3(0.26, 0.27, 0.30), vec3(0.55, 0.53, 0.50), plate);
        steel = mix(steel, vec3(0.19, 0.10, 0.05), soot * 0.4);        // scorch
        steel = mix(steel, vec3(0.34, 0.33, 0.31), scale * 0.25);      // mill scale
        albedo = mix(steel, vec3(0.015), crack * 0.9);                 // dark fissures

        // Worn, uneven finish; the fissure interiors are raw and rough.
        rough = clamp(mix(0.20 + scale * 0.35, 0.9, crack), 0.05, 1.0);
        metal = mix(0.98, 0.08, crack);

        // Molten stress fractures on a blackbody ramp — hottest cores go white,
        // so it reads as temperature rather than a coloured line.
        float heat = crack * (0.5 + 0.5 * sin(uTime * 1.8 + raw * 12.0));
        vec3 blackbody = mix(vec3(0.75, 0.06, 0.0), vec3(1.0, 0.93, 0.75), heat * heat);
        emit = blackbody * heat * 2.6;
      }
    `,
    emit: '#ff7a18',
    emit2: '#7fd4ff',
  },

  // --- Sharqiyah · geospatial / data ----------------------------------------
  data: {
    roughness: 0.88,
    metalness: 0.04,
    env: 0.35,
    bump: 0.5,
    rimColor: '#4fd8ff',
    rimPower: 2.0,
    rimStrength: 0.7,
    glsl: /* glsl */ `
      // Ridged terrain: sharp mountain crests and flat basins, like real relief.
      float heightField(vec3 p){
        float a = 1.0 - abs(snoise(p * 1.4));
        float b = 1.0 - abs(snoise(p * 3.1 + 7.0));
        return a * a * 0.7 + b * b * 0.3;
      }
      void themeSurface(vec3 p, vec3 on, out vec3 albedo, out float rough, out float metal, out vec3 emit){
        float a = 1.0 - abs(snoise(p * 1.4));
        float b = 1.0 - abs(snoise(p * 3.1 + 7.0));
        float elev = clamp(a * a * 0.7 + b * b * 0.3, 0.0, 1.0);

        // Arid cartographic palette: basin sand → ochre highlands → pale peaks.
        vec3 basin  = vec3(0.10, 0.13, 0.17);
        vec3 land   = vec3(0.42, 0.33, 0.18);
        vec3 peak   = vec3(0.80, 0.76, 0.68);
        albedo = mix(basin, land, smoothstep(0.18, 0.55, elev));
        albedo = mix(albedo, peak, smoothstep(0.68, 0.95, elev));

        // Bone dry. No sheen anywhere — the opposite of Raha.
        rough = 0.94 - elev * 0.12;
        metal = 0.02;

        // Survey contours at fixed elevation intervals. These follow the actual
        // relief, so they wrap the terrain the way real topographic lines do —
        // no lat/long graticule anywhere, which is what makes a procedural
        // planet look like a wireframe globe instead of a surveyed world.
        float rings = abs(fract(elev * 16.0) - 0.5);
        float contour = smoothstep(0.05, 0.0, rings);
        // Heavier index contour every 5th interval, as on a real survey sheet.
        float index = smoothstep(0.055, 0.0, abs(fract(elev * 3.2) - 0.5));

        // Sparse survey markers clustered on the high ground — data points on
        // the map, not a lattice over it.
        float mk = snoise(p * 7.0 + 44.0);
        float markers = smoothstep(0.86, 0.97, mk) * smoothstep(0.45, 0.75, elev);

        // A single acquisition plane sweeping the body, seen only where it
        // grazes the surface.
        float sweep = smoothstep(0.02, 0.0, abs(on.y - sin(uTime * 0.35) * 0.9));

        emit  = uEmit * contour * 0.9;      // amber contour lines
        emit += uEmit * index * 1.3;        // brighter index contours
        emit += uEmit2 * markers * 2.2;     // cyan survey markers
        emit += uEmit2 * sweep * 1.4;       // acquisition sweep
      }
    `,
    emit: '#ffc457',
    emit2: '#4fd8ff',
  },
}

export function createPlanetMaterial(project) {
  const cfg = THEMES[project.surface] || THEMES.data

  // One uniform bag, shared into the compiled shader. Because we hold the same
  // object reference, mutating `uniforms.uTime.value` from useFrame drives the
  // live shader — no need to reach into shader.uniforms after compile.
  const uniforms = {
    uTime: { value: 0 },
    uEmit: { value: new THREE.Color(cfg.emit) },
    uEmit2: { value: new THREE.Color(cfg.emit2) },
    uEmitStrength: { value: 1 },
    uBump: { value: cfg.bump },
    uRimColor: { value: new THREE.Color(cfg.rimColor) },
    uRimPower: { value: cfg.rimPower },
    uRimStrength: { value: cfg.rimStrength },
  }

  const material = new THREE.MeshStandardMaterial({
    roughness: cfg.roughness,
    metalness: cfg.metalness,
    envMapIntensity: cfg.env,
    emissive: new THREE.Color('#000000'),
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
      uniform vec3 uEmit;
      uniform vec3 uEmit2;
      uniform float uEmitStrength;
      uniform float uBump;
      uniform vec3 uRimColor;
      uniform float uRimPower;
      uniform float uRimStrength;
      varying vec3 vObjPos;
      varying mat3 vNMat;
      ${SIMPLEX_3D}

      // Quantise a value into hard steps with a short smooth riser. Used for
      // forged plating: gives flat plateaus with defined edges, without the
      // gradient discontinuity a raw floor() would punch through the bump pass.
      float terrace(float x, float steps){
        float s = x * steps;
        float f = floor(s);
        return (f + smoothstep(0.35, 0.65, fract(s))) / steps;
      }

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
      // Emissive + a per-theme limb term. For Raha this is the sub-surface
      // bleed (light scattering through thin tissue at the edge); for the
      // others it's a thin atmospheric/heat rim. `normal` and `vViewPosition`
      // are both resolved by this point in the chunk order.
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          float fres = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), uRimPower);
          totalEmissiveRadiance += gEmit * uEmitStrength;
          totalEmissiveRadiance += uRimColor * fres * uRimStrength * uEmitStrength;
        }`
      )
  }

  material.userData.uniforms = uniforms
  return material
}
