import * as THREE from 'three'
import geometry from '../data/titleGeometry.json'

// -----------------------------------------------------------------------------
// THE TITLE ARTWORK.
//
// The lettering is set in Rukyltronic Star, and it is NOT rasterised here. It is
// baked to a flat PNG ahead of time by scripts/build-title.mjs and committed;
// this module only loads that image and reads it back.
//
// WHY, IN ONE LINE: the font's licence is a desktop licence, and Typodermic's
// own guide puts "any use that serves or embeds the font in a website" outside
// it. Shipping fixed artwork is explicitly inside it. So the font stays on the
// machine that made the picture, and the site ships the picture.
//
// It is also strictly faster than what it replaces. There is no font to
// download, no glyph rasterisation, and no flood-fill on the main thread at
// startup — just one 17 KB image and a single pass to rebuild the ink map.
//
// The image is drawn back into a canvas rather than used directly as a texture
// because two other things need to know where the ink IS: the pointer hit test
// (so the title does not swallow clicks aimed at empty sky) and the ship's path
// audit (so the flight can be proved never to cross a letter).
// -----------------------------------------------------------------------------

export const CANVAS_W = geometry.canvasW
export const CANVAS_H = geometry.canvasH
/** World units per texel — sets the sign's size in the scene. */
export const TEXEL = geometry.texel
/** The one real opening in the phrase: the word space. See build-title.mjs. */
export const GATE = geometry.gate

const SRC = `${import.meta.env.BASE_URL}media/title/start-here.png`

/**
 * Load the baked title and rebuild its ink map.
 * Resolves to { texture, alpha } — alpha is one byte per texel, 0 or 255.
 */
export function loadTitle() {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = CANVAS_W
      canvas.height = CANVAS_H
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H)

      const data = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data
      const alpha = new Uint8Array(CANVAS_W * CANVAS_H)
      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        alpha[p] = data[i + 3] >= 128 ? 255 : 0
      }

      const texture = new THREE.CanvasTexture(canvas)
      // The whole point: no smoothing, no mip chain. Magnified texels stay
      // square, which is what makes this read as pixel type rather than as a
      // blown-up picture of pixel type.
      texture.magFilter = THREE.NearestFilter
      texture.minFilter = THREE.NearestFilter
      texture.generateMipmaps = false
      texture.colorSpace = THREE.SRGBColorSpace

      resolve({ texture, alpha })
    }
    img.onerror = reject
    img.src = SRC
  })
}

/** Canvas pixel -> plane-local offset in world units. Canvas y runs down,
 *  world y runs up. */
export function texelToLocal(px, py) {
  return [(px - CANVAS_W / 2) * TEXEL, -(py - CANVAS_H / 2) * TEXEL]
}

/**
 * Build an ink test in WORLD coordinates for a sign placed at `origin`.
 *
 * The ship's path is checked against this rather than against the sign's
 * bounding box. The quad is 37 x 16 units and almost all of it is empty space —
 * flying through the gap beside a word is fine and flying through the face of a
 * letter is not, and only the rendered pixels know the difference.
 *
 * `pad` dilates the ink by a few texels so a wingtip grazing a letter still
 * counts as a hit.
 */
export function makeInkTest(alpha, origin, pad = 3) {
  return (worldX, worldY) => {
    const px = Math.round((worldX - origin[0]) / TEXEL + CANVAS_W / 2)
    const py = Math.round(CANVAS_H / 2 - (worldY - origin[1]) / TEXEL)
    for (let dy = -pad; dy <= pad; dy++) {
      for (let dx = -pad; dx <= pad; dx++) {
        const x = px + dx
        const y = py + dy
        if (x < 0 || y < 0 || x >= CANVAS_W || y >= CANVAS_H) continue
        if (alpha[y * CANVAS_W + x]) return true
      }
    }
    return false
  }
}
