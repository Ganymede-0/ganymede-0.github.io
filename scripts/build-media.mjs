// -----------------------------------------------------------------------------
// Asset preparation for the Raha walkthrough.
//
// The source screenshots are 2880x1800 PNGs straight off a retina capture —
// around 40 MB for the set, which is far too much to ship to a visitor who may
// never open the dossier. This script converts them once, by hand, into the two
// sizes the UI actually renders, and the WebP output is what gets committed.
//
// It is NOT part of `npm run build`. It runs only when the screenshots change,
// which is close to never, and it needs a dependency the site itself does not:
//
//     npm install --no-save sharp
//     node scripts/build-media.mjs
//
// Keeping sharp out of package.json is deliberate. It is a large native module
// and nothing in the deployed site imports it — a contributor cloning this repo
// to change a paragraph should not have to compile libvips.
// -----------------------------------------------------------------------------

import { mkdir, readdir, copyFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const sharp = require('sharp')

const SOURCE = process.env.RAHA_SOURCE ?? 'C:/Users/be7au/Desktop/Raha Screenshot'
const OUT = 'public/media/raha'

// Two renditions, because the dossier shows each shot at two very different
// sizes and sending the large one to a 180px-wide grid cell is most of the
// weight for none of the detail.
//
// FULL is capped at 1600px rather than the source 2880: the lightbox never
// paints an image wider than the viewport, and on the 1440-class laptops this
// site is mostly read on, 1600 already exceeds the space available. Quality 80
// is the point where WebP stops visibly softening small UI text in these
// screenshots — 75 was measurably worse on the 11px table labels.
const FULL = { width: 1600, quality: 80, dir: 'full' }
const THUMB = { width: 560, quality: 72, dir: 'thumb' }

// Excluded by explicit request. `dark_home` is superseded by the wider
// `welcom sarah - dark` capture, and the light twin of that shot duplicates
// `Screenshot_home` without adding anything.
const EXCLUDE = new Set(['Screenshot_dark_home.png', 'welcome sarah - light.png'])

// Source name -> output slug. Deterministic, and the same transform is assumed
// by src/data/rahaMedia.js — if you change it here, that file breaks.
const slugify = (file) =>
  path
    .basename(file, '.png')
    .replace(/^Screenshot[_-]/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

async function main() {
  await Promise.all([
    mkdir(path.join(OUT, FULL.dir), { recursive: true }),
    mkdir(path.join(OUT, THUMB.dir), { recursive: true }),
  ])

  const entries = await readdir(SOURCE)
  const shots = entries.filter((f) => f.toLowerCase().endsWith('.png') && !EXCLUDE.has(f)).sort()

  console.log(`${shots.length} screenshots -> ${OUT}`)

  let fullBytes = 0
  let thumbBytes = 0
  const manifest = []

  for (const file of shots) {
    const slug = slugify(file)
    const src = path.join(SOURCE, file)

    for (const spec of [FULL, THUMB]) {
      const dest = path.join(OUT, spec.dir, `${slug}.webp`)
      const info = await sharp(src)
        // `withoutEnlargement` so a capture smaller than the cap is left alone
        // rather than being upscaled into softness.
        .resize({ width: spec.width, withoutEnlargement: true })
        .webp({ quality: spec.quality })
        .toFile(dest)

      if (spec === FULL) {
        fullBytes += info.size
        manifest.push({ slug, source: file, width: info.width, height: info.height })
      } else {
        thumbBytes += info.size
      }
    }
    process.stdout.write('.')
  }

  // The demo recording ships as-is: re-encoding it needs ffmpeg, which is not
  // available here, and 13 MB behind a click-to-play poster is acceptable when
  // nothing fetches it until the visitor asks for it.
  await copyFile('Raha - Demo.mp4', path.join(OUT, 'raha-demo.mp4'))

  // The poster is the platform's own landing page — a real frame would need
  // ffmpeg, and this is the honest stand-in: it is what the recording opens on.
  //
  // Cropped to the recording's own 1908x1086 aspect rather than the 16:10 of
  // the source capture. A poster in a different shape to its video letterboxes
  // inside the player, which reads as a broken asset.
  await sharp(path.join(SOURCE, 'Screenshot_home.png'))
    // `position: top` keeps the product headline; the crop takes it off the
    // bottom, which is empty page.
    .resize({ width: 1280, height: Math.round((1280 * 1086) / 1908), fit: 'cover', position: 'top' })
    .webp({ quality: 78 })
    .toFile(path.join(OUT, 'poster.webp'))

  await writeFile(
    path.join(OUT, 'manifest.json'),
    JSON.stringify({ generated: new Date().toISOString().slice(0, 10), shots: manifest }, null, 2)
  )

  const mb = (b) => `${(b / 1024 / 1024).toFixed(1)} MB`
  console.log(`\nfull  ${shots.length} files  ${mb(fullBytes)}`)
  console.log(`thumb ${shots.length} files  ${mb(thumbBytes)}`)
  console.log(`total (excl. video) ${mb(fullBytes + thumbBytes)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
